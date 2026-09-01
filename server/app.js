require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const stripe = require('./stripe');
const { handleWebhook } = require('./stripe-webhook');
const authRoutes = require('./routes/auth');
const subscriptionRoutes = require('./routes/subscription');
const invoiceRoutes = require('./routes/invoices');
const clientRoutes = require('./routes/clients');
const productRoutes = require('./routes/products');
const emailRoutes = require('./routes/email');
const numberingRoutes = require('./routes/numbering');
const oauthRoutes = require('./routes/oauth');
const templateRoutes = require('./routes/templates');
const { csrfProtection } = require('./middleware/csrf');

const app = express();

// Generate secure secrets at runtime if not provided via environment (development only)
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET must be set in production');
    process.exit(1);
  }
  process.env.JWT_SECRET = crypto.randomBytes(64).toString('hex');
  console.warn('[Security] Generated ephemeral JWT_SECRET for development. Set JWT_SECRET in production!');
}

if (!process.env.ENCRYPTION_KEY) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: ENCRYPTION_KEY must be set in production');
    process.exit(1);
  }
  process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
  console.warn('[Security] Generated ephemeral ENCRYPTION_KEY for development. Set ENCRYPTION_KEY in production!');
}

// Trust first proxy hop so req.ip reflects the real client IP (needed for rate limiting)
//
// IMPORTANT: This assumes a SINGLE reverse proxy (e.g., nginx, Cloudflare, AWS ALB) in front of the application.
// If you have multiple proxies (e.g., Cloudflare -> ALB -> app), change to:
//   app.set('trust proxy', 2); // or the number of proxy hops
// Or use 'loopback', 'linklocal', 'uniquelocal' for specific IP ranges.
// See: https://expressjs.com/en/guide/behind-proxies.html
app.set('trust proxy', 1);

// HTTPS enforcement in production (behind reverse proxy)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Check if request is already HTTPS via proxy headers
    const proto = req.header('x-forwarded-proto') || req.protocol;
    if (proto !== 'https') {
      const host = req.headers.host;
      if (host) {
        return res.redirect(301, 'https://' + host + req.originalUrl);
      }
    }
    next();
  });
}

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "blob:", "https://cdn.jsdelivr.net", "https://pagead2.googlesyndication.com", "https://accounts.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://cdn.jsdelivr.net"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' }
}));

// Permissions-Policy header (not in helmet v8, add manually)
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()');
  next();
});

const PUBLIC_DIR = path.join(__dirname, '..');
app.use((req, res, next) => {
  // Guard based on the URL path (not filesystem paths): block traversal
  // attempts and access to sensitive top-level directories.
  let urlPath;
  try {
    urlPath = decodeURIComponent(req.path);
  } catch {
    return res.status(400).json({ error: 'Bad request' });
  }
  if (urlPath.includes('..')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const topDir = urlPath.split('/').filter(Boolean)[0];
  if (topDir === 'server' || topDir === 'next-app' || topDir === 'node_modules') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
});
app.use(express.static(PUBLIC_DIR, {
  dotfiles: 'deny',
  index: false // Do not serve index.html by default on root, let Next.js handle `/`
}));
// Block direct access to sensitive files and directories
app.use('/server', (req, res) => res.status(403).json({ error: 'Forbidden' }));
app.use('/.env', (req, res) => res.status(403).json({ error: 'Forbidden' }));
app.use('/package.json', (req, res) => res.status(403).json({ error: 'Forbidden' }));
app.use('/package-lock.json', (req, res) => res.status(403).json({ error: 'Forbidden' }));

const ALLOWED_ORIGINS = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(s => s.trim())
  : ['http://localhost:8080', 'http://localhost:3000', 'http://127.0.0.1:8080', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // Block requests with no origin (non-browser clients, curl, etc.)
    if (!origin) {
      console.warn('[CORS] Blocked request with no origin');
      return callback(new Error('Not allowed by CORS: missing origin'));
    }
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    console.warn(`[CORS] Blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Handle CORS errors with 403 instead of default 500
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Not allowed by CORS' });
  }
  next(err);
});

app.use(cookieParser());

if (stripe) {
  app.post(
    '/webhook/stripe',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      // Require STRIPE_WEBHOOK_SECRET to be configured
      if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
        return res.status(500).json({ error: 'Webhook secret not configured on server' });
      }

      const sig = req.headers['stripe-signature'];

      try {
        const event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
        await handleWebhook(event);
        res.json({ received: true });
      } catch (err) {
        console.error('[Stripe Webhook] Signature verification failed:', err.message);
        res.status(400).json({ error: 'Webhook signature verification failed' });
      }
    }
  );
}

app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/config', (req, res) => {
  res.json({
    googleAdSense: {
      client: process.env.GOOGLE_ADSENSE_CLIENT || null,
      slot: process.env.GOOGLE_ADSENSE_SLOT || null
    },
    oauth: {
      googleClientId: process.env.GOOGLE_CLIENT_ID || null,
      githubClientId: process.env.GITHUB_CLIENT_ID || null
    }
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.use('/api/auth', authRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/products', productRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/numbering', numberingRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/templates', templateRoutes);

// Global error handler - must be last
app.use((err, req, res, next) => {
  console.error('[Error]', err.message, err.stack);

  const isProduction = process.env.NODE_ENV === 'production';

  // Don't leak stack traces in production
  if (isProduction) {
    return res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
    });
  }

  // Development: include stack trace for debugging
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    stack: err.stack,
  });
});

module.exports = app;
