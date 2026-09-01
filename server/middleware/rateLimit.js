/**
 * Redis-backed rate limiter for auth endpoints.
 * Tracks attempts per IP with a sliding window.
 */

const Redis = require('ioredis');

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;
const WINDOW_SEC = Math.ceil(WINDOW_MS / 1000);

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
      console.error('[RateLimit] Redis connection error:', err.message);
    });
  }
  return redis;
}

async function rateLimit(req, res, next) {
  // Only trust X-Forwarded-For when app is behind a known reverse proxy
  const ip = (req.app.get('trust proxy') && req.headers['x-forwarded-for'])
    ? req.headers['x-forwarded-for'].split(',')[0].trim()
    : req.ip
      || req.connection.remoteAddress
      || 'unknown';

  const r = getRedis();
  try {
    await r.connect();
    const key = `ratelimit:auth:${ip}`;
    
    // Use Redis INCR with EXPIRE for atomic counter with TTL
    const count = await r.incr(key);
    
    if (count === 1) {
      // First request in window, set expiry
      await r.expire(key, WINDOW_SEC);
    }
    
    if (count > MAX_ATTEMPTS) {
      const ttl = await r.ttl(key);
      const remainingSec = ttl > 0 ? ttl : WINDOW_SEC;
      return res.status(429).json({
        error: `Too many attempts. Try again in ${Math.ceil(remainingSec / 60)} minutes.`
      });
    }
    
    next();
  } catch (err) {
    console.error('[RateLimit] Error:', err);
    // Fail open - allow request through if Redis is unavailable
    next();
  }
}

module.exports = { rateLimit };
