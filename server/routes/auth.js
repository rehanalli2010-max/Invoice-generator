const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const zxcvbn = require('zxcvbn');
const db = require('../db');
const stripe = require('../stripe');
const { authenticate, setAuthCookies, clearAuthCookies } = require('../middleware/auth');
const { csrfToken, csrfProtection } = require('../middleware/csrf');
const { TIER_LIMITS, resetIfNewDay } = require('../middleware/actionLimit');
const { rateLimit } = require('../middleware/rateLimit');
const {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  verifyRefreshToken,
  rotateRefreshToken,
  revokeAllUserRefreshTokens,
  REFRESH_TOKEN_EXPIRY_DAYS,
} = require('../utils/tokens');
const { logAudit } = require('../utils/auditLog');

const router = express.Router();

router.post('/register', rateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Password strength check using zxcvbn (minimum score 3 = "strong")
    const strength = zxcvbn(password);
    if (strength.score < 3) {
      const feedback = strength.feedback.warning || strength.feedback.suggestions.join(' ');
      return res.status(400).json({
        error: 'Password is too weak. ' + feedback,
        score: strength.score,
        suggestions: strength.feedback.suggestions
      });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    db.prepare(
      'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)'
    ).run(id, email, passwordHash);

    const accessToken = generateAccessToken(id, 0);
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    await storeRefreshToken(id, refreshToken, expiresAt);

    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json({
      accessToken,
      refreshToken,
      user: { id, email, tier: 'free', actionCount: 0, actionLimit: 20 },
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', rateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = db.prepare(
      'SELECT id, email, password_hash, tier, daily_action_count, stripe_subscription_id, daily_action_date, token_version, failed_login_attempts, locked_until FROM users WHERE email = ?'
    ).get(email);

    if (!user) {
      // Don't reveal whether the email exists, but still apply rate limiting
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const unlockTime = new Date(user.locked_until).toISOString();
      return res.status(423).json({
        error: 'Account temporarily locked due to too many failed login attempts',
        lockedUntil: unlockTime
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      // Increment failed login attempts
      const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
      const MAX_FAILED_ATTEMPTS = 5;
      const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCK_DURATION_MS).toISOString();
        db.prepare('UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?')
          .run(newFailedAttempts, lockedUntil, user.id);
        return res.status(423).json({
          error: 'Account temporarily locked due to too many failed login attempts',
          lockedUntil
        });
      } else {
        db.prepare('UPDATE users SET failed_login_attempts = ? WHERE id = ?')
          .run(newFailedAttempts, user.id);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    // Successful login - reset failed attempts and lock
    if (user.failed_login_attempts > 0 || user.locked_until) {
      db.prepare('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?')
        .run(user.id);
    }

    const accessToken = generateAccessToken(user.id, user.token_version || 0);
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    await storeRefreshToken(user.id, refreshToken, expiresAt);

    setAuthCookies(res, accessToken, refreshToken);

    // Fix 7: reset counts on login display accurately
    const freshUser = resetIfNewDay(user.id) || user;
    const limit = TIER_LIMITS[freshUser.tier] || TIER_LIMITS.free;

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: freshUser.id || user.id,
        email: user.email,
        tier: freshUser.tier,
        actionCount: freshUser.daily_action_count || 0,
        actionLimit: limit === Infinity ? null : limit,
        stripeSubscriptionId: user.stripe_subscription_id || null
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticate, (req, res) => {
  // Fix 7: reset counts on /me fetching to display accurately
  const freshUser = resetIfNewDay(req.user.id);

  if (!freshUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const userEmails = db.prepare(
    'SELECT email, stripe_subscription_id FROM users WHERE id = ?'
  ).get(req.user.id);

  const limit = TIER_LIMITS[freshUser.tier] || TIER_LIMITS.free;

  res.json({
    user: {
      id: req.user.id,
      email: userEmails.email,
      tier: freshUser.tier,
      actionCount: freshUser.daily_action_count || 0,
      actionLimit: limit === Infinity ? null : limit,
      stripeSubscriptionId: userEmails.stripe_subscription_id || null
    }
  });
});

// POST /api/auth/forgot-password — generate reset token
router.post('/forgot-password', rateLimit, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email);

    // Don't reveal whether the email exists
    if (!user) {
      return res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
    }

    // Invalidate old tokens
    db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0').run(user.id);

    const tokenId = uuidv4();
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    db.prepare(
      'INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)'
    ).run(tokenId, user.id, token, expiresAt);

    // In production, send email with reset link.
    // For development, log a masked version (first 8 chars only) to help with testing.
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:8080';

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[PasswordReset] Token for ${email}: ${token.substring(0, 8)}... (masked)`);
      console.log(`[PasswordReset] Reset link: ${frontendUrl}/?reset_token=<token>`);
    }

    res.json({
      success: true,
      message: 'If the email exists, a reset link has been sent.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// POST /api/auth/reset-password — consume token and update password
router.post('/reset-password', rateLimit, async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    // Password strength check using zxcvbn (minimum score 3 = "strong")
    const strength = zxcvbn(password);
    if (strength.score < 3) {
      const feedback = strength.feedback.warning || strength.feedback.suggestions.join(' ');
      return res.status(400).json({
        error: 'Password is too weak. ' + feedback,
        score: strength.score,
        suggestions: strength.feedback.suggestions
      });
    }

    const row = db.prepare(
      'SELECT id, user_id, expires_at, used FROM password_reset_tokens WHERE token = ?'
    ).get(token);

    if (!row) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    if (row.used) {
      return res.status(400).json({ error: 'Reset token has already been used' });
    }

    if (new Date(row.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    db.prepare('UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?').run(passwordHash, row.user_id);
    db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(row.id);
    await revokeAllUserRefreshTokens(row.user_id);

    logAudit(row.user_id, 'password_reset', 'user', row.user_id, null, { method: 'reset_token' }, req);

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// POST /api/auth/refresh — rotate refresh token and issue new access token
router.post('/refresh', rateLimit, async (req, res) => {
  try {
    // Accept refresh token from body or cookie
    const refreshToken = req.body.refreshToken || req.cookies?.refresh_token;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const result = await verifyRefreshToken(refreshToken);
    if (!result) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    if (result.revoked) {
      await revokeAllUserRefreshTokens(result.userId);
      return res.status(401).json({ error: 'Token revoked. Please log in again.' });
    }
    if (result.expired) {
      return res.status(401).json({ error: 'Refresh token expired. Please log in again.' });
    }

    const user = db.prepare('SELECT id, token_version FROM users WHERE id = ?').get(result.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const newAccessToken = generateAccessToken(user.id, user.token_version);
    const newRefreshToken = generateRefreshToken();
    const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    await rotateRefreshToken(result.tokenHash, user.id, newRefreshToken, newExpiresAt);

    setAuthCookies(res, newAccessToken, newRefreshToken);

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// POST /api/auth/logout — revoke current token by incrementing token_version and revoke refresh tokens
router.post('/logout', authenticate, csrfProtection, async (req, res) => {
  try {
    db.prepare('UPDATE users SET token_version = token_version + 1 WHERE id = ?').run(req.user.id);
    await revokeAllUserRefreshTokens(req.user.id);
    clearAuthCookies(res);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// DELETE /api/auth/account — delete user and invalidate all their tokens
router.delete('/account', authenticate, csrfProtection, async (req, res) => {
  try {
    // Cancel Stripe subscription if user has one
    if (stripe) {
      const user = db.prepare('SELECT stripe_customer_id FROM users WHERE id = ?').get(req.user.id);
      if (user && user.stripe_customer_id) {
        try {
          const subscriptions = await stripe.subscriptions.list({ customer: user.stripe_customer_id });
          for (const sub of subscriptions.data) {
            await stripe.subscriptions.cancel(sub.id);
          }
        } catch (stripeErr) {
          console.error('[Account] Failed to cancel Stripe subscription:', stripeErr.message);
        }
      }
    }

    // Increment token version first to invalidate any in-flight tokens
    db.prepare('UPDATE users SET token_version = token_version + 1 WHERE id = ?').run(req.user.id);

    // Delete user data in a transaction to prevent partial deletion on error
    await revokeAllUserRefreshTokens(req.user.id);

    const deleteAccount = db.transaction(() => {
      db.prepare('DELETE FROM invoices WHERE user_id = ?').run(req.user.id);
      db.prepare('DELETE FROM clients WHERE user_id = ?').run(req.user.id);
      db.prepare('DELETE FROM email_configs WHERE user_id = ?').run(req.user.id);
      db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(req.user.id);
      db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(req.user.id);
      db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
    });
    deleteAccount();

    logAudit(req.user.id, 'account_delete', 'user', req.user.id, null, { reason: 'user_initiated' }, req);

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// GET /api/auth/csrf-token — get CSRF token
router.get('/csrf-token', authenticate, rateLimit, csrfToken);

// PUT /api/auth/timezone — update user timezone
router.put('/timezone', authenticate, csrfProtection, (req, res) => {
  try {
    const { timezone } = req.body;
    if (!timezone) return res.status(400).json({ error: 'Timezone required' });

    // Validate timezone against known list
    const validTimezones = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : null;
    if (validTimezones && !validTimezones.includes(timezone)) {
      return res.status(400).json({ error: 'Invalid timezone' });
    }

    const oldTimezone = db.prepare('SELECT timezone FROM users WHERE id = ?').get(req.user.id)?.timezone || 'UTC';

    db.prepare('UPDATE users SET timezone = ? WHERE id = ?').run(timezone, req.user.id);
    logAudit(req.user.id, 'timezone_update', 'user', req.user.id, { timezone: oldTimezone }, { timezone }, req);
    res.json({ success: true, timezone });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update timezone' });
  }
});

module.exports = router;
