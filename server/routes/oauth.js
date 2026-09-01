const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { TIER_LIMITS, resetIfNewDay } = require('../middleware/actionLimit');
const { rateLimit } = require('../middleware/rateLimit');
const {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  REFRESH_TOKEN_EXPIRY_DAYS,
} = require('../utils/tokens');
const { setAuthCookies } = require('../middleware/auth');

const router = express.Router();

const OAUTH_STATE_TTL = 10 * 60 * 1000;

function getClientIp(req) {
  // Trust proxy is enabled in app.js, so req.ip should be the real client IP
  return req.ip || req.connection?.remoteAddress || 'unknown';
}

function generateState(req) {
  const state = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + OAUTH_STATE_TTL;
  const clientIp = getClientIp(req);
  db.prepare('INSERT OR REPLACE INTO oauth_states (state, ip, expires_at) VALUES (?, ?, ?)').run(state, clientIp, expiresAt);
  cleanupExpiredStates();
  return state;
}

function verifyState(state, req) {
  cleanupExpiredStates();
  if (!state) return false;
  const clientIp = getClientIp(req);
  const row = db.prepare('SELECT expires_at FROM oauth_states WHERE state = ? AND ip = ?').get(state, clientIp);
  if (!row) return false;
  db.prepare('DELETE FROM oauth_states WHERE state = ?').run(state);
  return Date.now() < row.expires_at;
}

function cleanupExpiredStates() {
  db.prepare('DELETE FROM oauth_states WHERE expires_at < ?').run(Date.now());
}

async function verifyGoogleToken(idToken) {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!res.ok) throw new Error('Invalid Google token');
  const payload = await res.json();
  return payload;
}

router.get('/state', (req, res) => {
  const state = generateState(req);
  res.json({ state });
});

router.post('/google', rateLimit, async (req, res) => {
  try {
    const { credential, email: bodyEmail, name: bodyName, state } = req.body;
    if (!verifyState(state, req)) {
      return res.status(403).json({ error: 'Invalid or missing state parameter' });
    }

    let email;
    if (credential) {
      const googleUser = await verifyGoogleToken(credential);
      email = googleUser.email;
      if (!email || googleUser.aud !== process.env.GOOGLE_CLIENT_ID || googleUser.email_verified !== 'true') {
        return res.status(401).json({ error: 'Invalid Google token' });
      }
    } else {
      return res.status(400).json({ error: 'Google credential required' });
    }

    let user = db.prepare('SELECT id, email, tier, token_version FROM users WHERE email = ?').get(email);
    if (!user) {
      const id = uuidv4();
      db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(id, email, 'oauth:google');
      user = { id, email, tier: 'free', token_version: 0 };
    }

    const accessToken = generateAccessToken(user.id, user.token_version || 0);
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    await storeRefreshToken(user.id, refreshToken, expiresAt);
    setAuthCookies(res, accessToken, refreshToken);
    const freshUser = resetIfNewDay(user.id) || user;
    const limit = TIER_LIMITS[freshUser.tier] || TIER_LIMITS.free;
    res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, tier: user.tier, actionCount: freshUser.daily_action_count || 0, actionLimit: limit === Infinity ? null : limit } });
  } catch (err) {
    res.status(500).json({ error: 'OAuth failed' });
  }
});

router.post('/github', rateLimit, async (req, res) => {
  try {
    const { code, state } = req.body;
    if (!code) return res.status(400).json({ error: 'Authorization code required' });
    if (!verifyState(state, req)) {
      return res.status(403).json({ error: 'Invalid or missing state parameter' });
    }

    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(400).json({ error: 'Failed to get GitHub access token' });
    }

    // Fetch user email
    const userRes = await fetch('https://api.github.com/user/emails', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    const emails = await userRes.json();
    const primary = emails.find(e => e.primary) || emails[0];
    if (!primary || !primary.email) {
      return res.status(400).json({ error: 'No email found from GitHub' });
    }

    const email = primary.email;
    let user = db.prepare('SELECT id, email, tier, token_version FROM users WHERE email = ?').get(email);
    if (!user) {
      const id = uuidv4();
      db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(id, email, 'oauth:github');
      user = { id, email, tier: 'free', token_version: 0 };
    }

    const accessToken = generateAccessToken(user.id, user.token_version || 0);
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    await storeRefreshToken(user.id, refreshToken, expiresAt);
    setAuthCookies(res, accessToken, refreshToken);
    const freshUser = resetIfNewDay(user.id) || user;
    const limit = TIER_LIMITS[freshUser.tier] || TIER_LIMITS.free;
    res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, tier: user.tier, actionCount: freshUser.daily_action_count || 0, actionLimit: limit === Infinity ? null : limit } });
  } catch (err) {
    res.status(500).json({ error: 'OAuth failed' });
  }
});

module.exports = router;
