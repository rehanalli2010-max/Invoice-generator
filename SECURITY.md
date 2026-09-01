# Security Documentation

## Overview

This document describes the security measures implemented in the Invoice Generator application.

## Authentication & Authorization

### JWT Token Strategy

- **Access Tokens**: Short-lived (15 minutes), JWT-based, sent in Authorization header or HttpOnly cookie
- **Refresh Tokens**: Long-lived (30 days), stored as SHA-256 hashes in database, rotated on each use
- **Token Rotation**: Refresh tokens are single-use; each refresh generates a new token pair and revokes the old refresh token
- **Token Revocation**: User token version incremented on password change, logout, or account deletion

### Cookie Security

When using cookie-based authentication (browser clients), cookies are set with:
- `HttpOnly`: Prevents XSS access to tokens
- `Secure`: Only sent over HTTPS (production only)
- `SameSite=Strict`: CSRF protection (production); `Lax` in development for localhost testing
- Short expiry matching token lifetimes

### Password Security

- Bcrypt with cost factor 10
- Minimum password strength enforced via zxcvbn (score >= 3)
- Account lockout after 5 failed attempts (15-minute lockout)
- Password reset tokens expire in 1 hour, single-use

### Rate Limiting

- Redis-backed sliding window rate limiter on auth endpoints
- 10 attempts per 15 minutes per IP
- Fail-open design (allows requests if Redis unavailable)

## Infrastructure Requirements

### Trust Proxy Configuration

The application uses `app.set('trust proxy', 1)` which assumes **exactly one reverse proxy** between the client and the Node.js application.

**Valid configurations:**
- Client → nginx → Node.js
- Client → Cloudflare → Node.js
- Client → AWS ALB → Node.js

**Invalid configurations (require adjustment):**
- Client → Cloudflare → nginx → Node.js (use `trust proxy: 2`)
- Client → Cloudflare → AWS ALB → nginx → Node.js (use `trust proxy: 3`)

If your infrastructure has multiple proxy hops, update the `trust proxy` setting in `server/app.js`.

### HTTPS Enforcement

In production (`NODE_ENV=production`), the application:
- Redirects HTTP to HTTPS via `x-forwarded-proto` header
- Sets HSTS header (1 year, includeSubDomains, preload)
- Requires `Secure` cookies

Ensure your reverse proxy:
1. Terminates TLS
2. Sets `X-Forwarded-Proto: https` header
3. Sets `X-Forwarded-For` header with client IP

## Environment Variables

### Required in Production

| Variable | Description | Generation |
|----------|-------------|------------|
| `JWT_SECRET` | Signing key for JWT tokens (64+ chars) | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `ENCRYPTION_KEY` | AES-256-GCM key for sensitive data (32 chars) | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `STRIPE_SECRET_KEY` | Stripe secret API key | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Stripe Dashboard |
| `CLIENT_URL` | Frontend URL for CORS | Your domain |

### Optional

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |
| `REDIS_URL` | Redis connection string (default: localhost:6379) |
| `CRON_ENABLED` | Enable cron jobs (set to "true" on leader instance) |
| `INSTANCE_ROLE` | Set to "leader" on primary instance |

## Dependency Security

### Automated Scanning

- **Dependabot**: Weekly checks for npm dependency updates (configured in `.github/dependabot.yml`)
- **npm audit**: Runs in CI pipeline on every PR (configured in `.github/workflows/ci.yml`)
- **Auto-merge**: Patch and minor updates auto-merge if CI passes

### Manual Scanning

```bash
# Server dependencies
cd server && npm audit

# Root dependencies
npm audit

# Fix vulnerabilities
npm audit fix
```

## Error Handling

### Production Error Responses

In production (`NODE_ENV=production`):
- Stack traces are **never** returned to clients
- Generic error messages for 500 errors
- Detailed errors logged server-side only

### Development Error Responses

In development:
- Full stack traces returned for debugging
- Detailed error messages

## CORS Configuration

- Strict origin validation against `CLIENT_URL` environment variable
- Credentials allowed (for cookies)
- Requests without Origin header rejected (blocks curl, non-browser clients)

## Content Security Policy

Helmet.js configured with restrictive CSP:
- Scripts: Self, inline (required for Next.js), Stripe, Google services
- Styles: Self, inline, Google Fonts
- Fonts: Self, Google Fonts, data URIs
- Images: Self, data, blob, HTTPS
- Connect: Self, Stripe API, CDN
- Frames: Self, Stripe
- Object/embed: None
- Base URI: Self
- Form action: Self
- Frame ancestors: None

## Security Headers

Additional headers set via Helmet and custom middleware:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()`
- `Content-Security-Policy`: (see above)

## File Access Protection

Static file server blocks access to:
- `server/` directory
- `.env` files
- `package.json`, `package-lock.json`
- `node_modules/`
- `next-app/`
- Hidden files/directories (except `.well-known`)
- Path traversal attempts (`..`)

## Database Security

- SQLite with WAL mode
- Foreign key constraints enabled
- Prepared statements (no SQL injection)
- Sensitive data encrypted with AES-256-GCM (email passwords, etc.)
- CASCADE DELETE on related tables

## OAuth Security

- State parameter with IP binding (10-minute expiry)
- PKCE not used (Google uses ID tokens, GitHub uses authorization code flow)
- Client secrets stored in environment variables
- Token exchange server-side only

## Deployment Checklist

Before deploying to production:

- [ ] Set all required environment variables
- [ ] Verify `NODE_ENV=production`
- [ ] Verify single proxy hop or adjust `trust proxy`
- [ ] Configure reverse proxy with TLS termination
- [ ] Set `X-Forwarded-Proto` and `X-Forwarded-For` headers
- [ ] Configure Redis for rate limiting
- [ ] Run `npm audit` and resolve high/critical issues
- [ ] Test authentication flow (register, login, refresh, logout)
- [ ] Test password reset flow
- [ ] Test OAuth flows
- [ ] Verify CSP doesn't break frontend
- [ ] Verify HTTPS redirect works
- [ ] Verify HSTS header present
- [ ] Verify cookies have Secure/SameSite flags