const crypto = require('crypto');
const Redis = require('ioredis');

const TOKEN_TTL = 24 * 60 * 60; // 24 hours in seconds
const MAX_TOKENS = 10000;

let redis;
function getRedis() {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      lazyConnect: true,
    });
    redis.on('error', (err) => {
      console.error('[CSRF] Redis connection error:', err.message);
    });
  }
  return redis;
}

async function generateToken(userId) {
  const r = getRedis();
  await r.connect();
  
  // Clean up expired tokens if we're near capacity
  const currentCount = await r.scard('csrf:tokens');
  if (currentCount >= MAX_TOKENS) {
    // Use SCAN to find and remove expired tokens
    let cursor = '0';
    let cleaned = 0;
    do {
      const [newCursor, keys] = await r.scan(cursor, 'MATCH', 'csrf:token:*', 'COUNT', 100);
      cursor = newCursor;
      for (const key of keys) {
        const ttl = await r.ttl(key);
        if (ttl === -1) { // No expiry set, remove it
          await r.del(key);
          cleaned++;
        }
      }
    } while (cursor !== '0');
    
    // If still over capacity, remove oldest (approximate)
    if (cleaned < MAX_TOKENS * 0.1) {
      const keys = await r.keys('csrf:token:*');
      const toRemove = keys.slice(0, Math.ceil(MAX_TOKENS * 0.2));
      if (toRemove.length > 0) {
        await r.del(...toRemove);
      }
    }
  }

  const token = crypto.randomBytes(32).toString('hex');
  const key = `csrf:token:${token}`;
  await r.setex(key, TOKEN_TTL, userId);
  await r.sadd('csrf:tokens', key);
  return token;
}

function csrfToken(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  generateToken(req.user.id).then(token => {
    res.json({ csrfToken: token });
  }).catch(err => {
    console.error('[CSRF] Token generation error:', err);
    res.status(500).json({ error: 'Failed to generate CSRF token' });
  });
}

async function csrfProtection(req, res, next) {
  const method = req.method;
  if (['GET', 'HEAD'].includes(method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'];
  if (!token) {
    return res.status(403).json({ error: 'CSRF token required' });
  }

  const r = getRedis();
  try {
    await r.connect();
    const key = `csrf:token:${token}`;
    const storedUserId = await r.get(key);
    
    if (!storedUserId) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }

    if (storedUserId !== req.user.id) {
      return res.status(403).json({ error: 'CSRF token mismatch' });
    }

    // Token is valid — refresh TTL to keep it alive during active session
    await r.expire(key, TOKEN_TTL);
    next();
  } catch (err) {
    console.error('[CSRF] Validation error:', err);
    res.status(500).json({ error: 'CSRF validation failed' });
  }
}

module.exports = { csrfToken, csrfProtection };
