const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../db');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

function generateAccessToken(userId, tokenVersion) {
  return jwt.sign({ userId, tokenVersion }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function storeRefreshToken(userId, token, expiresAt) {
  const tokenHash = hashRefreshToken(token);
  const id = crypto.randomUUID();
  db.prepare(
    'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)'
  ).run(id, userId, tokenHash, expiresAt.toISOString());
  return tokenHash;
}

async function verifyRefreshToken(token) {
  const tokenHash = hashRefreshToken(token);
  const row = db.prepare(
    'SELECT id, user_id, expires_at, revoked, replaced_by_token_hash FROM refresh_tokens WHERE token_hash = ?'
  ).get(tokenHash);

  if (!row) return null;
  if (row.revoked) return { revoked: true };
  if (new Date(row.expires_at) < new Date()) return { expired: true };

  return { id: row.id, userId: row.user_id, tokenHash };
}

async function revokeRefreshToken(tokenHash) {
  db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?').run(tokenHash);
}

async function rotateRefreshToken(oldTokenHash, userId, newToken, newExpiresAt) {
  const newTokenHash = hashRefreshToken(newToken);
  db.prepare(
    'UPDATE refresh_tokens SET revoked = 1, replaced_by_token_hash = ? WHERE token_hash = ?'
  ).run(newTokenHash, oldTokenHash);

  const id = crypto.randomUUID();
  db.prepare(
    'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)'
  ).run(id, userId, newTokenHash, newExpiresAt.toISOString());

  return newTokenHash;
}

async function revokeAllUserRefreshTokens(userId) {
  db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?').run(userId);
}

async function cleanupExpiredRefreshTokens() {
  db.prepare("DELETE FROM refresh_tokens WHERE expires_at < datetime('now') OR revoked = 1").run();
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  storeRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
  revokeAllUserRefreshTokens,
  cleanupExpiredRefreshTokens,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY_DAYS,
};