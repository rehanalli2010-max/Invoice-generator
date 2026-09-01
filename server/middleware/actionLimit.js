const db = require('../db');

const TIER_LIMITS = {
  free: 20,
  startup: 500,
  business: Infinity
};

/**
 * Compute the "effective date" for a user based on a 6 AM local-time reset.
 * Before 6 AM the user is still on yesterday's budget; from 6 AM onward
 * a fresh daily quota begins.  Falls back to UTC if no timezone is stored.
 */
function getEffectiveDate(userId) {
  const row = db.prepare('SELECT timezone FROM users WHERE id = ?').get(userId);
  const tz = (row && row.timezone) || 'UTC';
  const now = new Date();
  let hour;
  try {
    hour = parseInt(
      new Intl.DateTimeFormat('en', { hour: 'numeric', hour12: false, timeZone: tz }).format(now),
      10
    );
  } catch {
    hour = now.getUTCHours();
  }
  const effective = new Date(now);
  if (hour < 6) effective.setUTCDate(effective.getUTCDate() - 1);
  const y = effective.getUTCFullYear();
  const m = String(effective.getUTCMonth() + 1).padStart(2, '0');
  const d = String(effective.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function resetIfNewDay(userId) {
  const today = getEffectiveDate(userId);
  const user = db.prepare(
    'SELECT tier, daily_action_count, daily_action_date FROM users WHERE id = ?'
  ).get(userId);

  if (!user) {
    return null;
  }

  if (user.daily_action_date !== today) {
    db.prepare(
      'UPDATE users SET daily_action_count = 0, daily_action_date = ? WHERE id = ?'
    ).run(today, userId);
    user.daily_action_count = 0;
    user.daily_action_date = today;
  }

  return user;
}

function actionLimit(req, res, next) {
  const { id: userId, tier } = req.user;
  const today = getEffectiveDate(userId);
  const limit = TIER_LIMITS[tier] || TIER_LIMITS.free;

  if (limit === Infinity) {
    return next();
  }

  const result = db.prepare(`
    UPDATE users
    SET daily_action_count = CASE
      WHEN daily_action_date = ? THEN daily_action_count + 1
      ELSE 1
    END,
    daily_action_date = ?
    WHERE id = ?
      AND (
        daily_action_date != ?
        OR daily_action_count < ?
      )
  `).run(today, today, userId, today, limit);

  if (result.changes === 0) {
    const user = db.prepare('SELECT daily_action_count FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(429).json({
      error: 'Daily action limit reached',
      limit,
      used: user.daily_action_count
    });
  }

  next();
}

function incrementActionCount(userId) {
  const today = getEffectiveDate(userId);

  db.prepare(`
    UPDATE users
    SET daily_action_count = CASE
      WHEN daily_action_date = ? THEN daily_action_count + 1
      ELSE 1
    END,
    daily_action_date = ?
    WHERE id = ?
  `).run(today, today, userId);
}

module.exports = { actionLimit, incrementActionCount, TIER_LIMITS, resetIfNewDay, getEffectiveDate };
