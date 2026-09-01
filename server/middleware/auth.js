const jwt = require('jsonwebtoken');
const db = require('../db');

const COOKIE_NAME = 'access_token';
const REFRESH_COOKIE_NAME = 'refresh_token';

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction, // Only sent over HTTPS in production
    sameSite: isProduction ? 'strict' : 'lax', // CSRF protection
    maxAge: 15 * 60 * 1000, // 15 minutes (matches access token expiry)
    path: '/',
  };
}

function getRefreshCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days (matches refresh token expiry)
    path: '/',
  };
}

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie(COOKIE_NAME, accessToken, getCookieOptions());
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
}

function clearAuthCookies(res) {
  res.clearCookie(COOKIE_NAME, { ...getCookieOptions(), maxAge: 0 });
  res.clearCookie(REFRESH_COOKIE_NAME, { ...getRefreshCookieOptions(), maxAge: 0 });
}

function authenticate(req, res, next) {
  // Try Authorization header first (for API clients)
  let token = req.headers.authorization?.split(' ')[1];

  // Fallback to cookie (for browser clients)
  if (!token && req.cookies) {
    token = req.cookies[COOKIE_NAME];
  }

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT id, email, tier, daily_action_count, stripe_customer_id, stripe_subscription_id, token_version FROM users WHERE id = ?').get(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Reject tokens issued before a password change or account deletion.
    // Treat missing tokenVersion as 0 so old tokens (pre-revocation system) are
    // not silently accepted when the user's token_version has been incremented.
    const tokenVersion = decoded.tokenVersion ?? 0;
    if (tokenVersion !== user.token_version) {
      return res.status(401).json({ error: 'Token revoked. Please log in again.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { authenticate, setAuthCookies, clearAuthCookies, COOKIE_NAME, REFRESH_COOKIE_NAME };
