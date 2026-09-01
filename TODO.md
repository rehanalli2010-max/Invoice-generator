# Phase 5: Fix Bugs & Polish - Implementation Progress

## Priority & Order

### 5.1 Bug: Bulk import bypasses rate limit (partially fixed in invoices.js, but also needs in clients.js)
- [x] `server/routes/invoices.js` - Add robust bulk limit check to `POST /import` route
- [x] `server/routes/clients.js` - Add matching bulk limit check to `POST /import`

### 5.2 Bug: closeAuthUI vs closeAuthModal
- [x] `js/modules/auth.js` - Consolidated to a single `closeAuthUI` (closes modal + resets form state + `updateAuthUI`); removed duplicate `closeAuthModal`
- [x] `js/app.js` - Import/assignment updated; OAuth login now calls `closeAuthUI` (was `closeAuthModal`, which skipped the UI refresh)
- [x] `js/modules/ui.js` - Escape-key close on auth modal repointed to `closeAuthUI`

### 5.3 Bug: No CORS origin validation
- [x] `server/app.js` - Add stricter origin validation (no `|| true` fallback)

### 5.4 Bug: Stripe init crashes if key missing
- [x] `server/stripe.js` - Export `null` when `STRIPE_SECRET_KEY` missing
- [x] `server/routes/subscription.js` - Guard `if (!stripe)` → 503 router
- [x] `server/app.js` - Webhook mounted only `if (stripe)`

### 5.5 Bug: No password reset
- [x] `server/db.js` - Add `password_reset_tokens` table
- [x] `server/routes/auth.js` - Add `POST /forgot-password` and `POST /reset-password` endpoints
- [x] `js/modules/auth.js` - Add forgot password UI (link + modal + functionality)
- [x] `index.html` - Add forgot password / reset password modal HTML
- [x] Client reset step: `js/modules/auth.js` `showResetPassword`/`handleResetPassword`, `js/app.js` `initResetPassword` reads `?reset_token=` and auto-opens the reset form (E2E verified)

### 5.6 Security: CSRF protection
- [x] `server/middleware/csrf.js` + `server/app.js` - CSRF middleware wired on all state-changing routes
- [x] Client-side: `js/modules/api.js` `ensureCsrfToken()` fetches `/api/auth/csrf-token` and sends `X-CSRF-Token`

### 5.7 Security: Input sanitization
- [x] Create `server/middleware/validate.js` - Input validation middleware for invoice data
- [x] `server/routes/invoices.js` - Apply validation middleware to POST/PUT routes
- [x] `server/routes/clients.js` - Apply client validation to POST route
- [x] `server/routes/email.js` - Apply email config validation to POST route

### 5.8 UX: Loading states
- [x] `js/modules/auth.js` - Add loading spinners for login/register/forgot
- [x] `js/modules/api.js` - Add loading state for invoice list loading
- [x] `js/modules/invoice-ui.js` - Add loading state for save operations
- [x] `css/style.css` - Add spinner animation CSS

### 5.9 UX: Error boundaries
- [x] `js/app.js` - `safeWrap()` now applied to render/operation handlers (renderHistoryList, updateAnalyticsDashboard, renderDashboard, renderClientList, renderClientDropdown, updatePreview, searchHistory, filterHistory) + init steps; catches sync throws and async rejections

### 5.10 Accessibility: ARIA audit
- [x] `index.html` - Modals have `role=dialog`/`aria-modal`/`aria-labelledby` (authModal, confirmModal, interstitialAd)
- [x] `clients.html` - `clientModal` gained `role=dialog aria-modal aria-labelledby`
- [x] `js/modules/ui.js` - Focus management in place (`_focusModal`/`_restoreFocus`, Tab trap)

### 5.11 Mobile: Table responsiveness
- [x] `css/style.css` - Responsive table styles with card layout (`data-label` on mobile)

### 5.12 Performance: Lazy load
- [x] `index.html` - `defer` on non-critical scripts (page-transition.js; window-fix.js kept synchronous intentionally)
- [x] `js/app.js` - ES modules already lazy; heavy libs (Chart.js) dynamically imported

### Regression found & fixed during verification
- [x] **BUG-05 charts broke `js/modules/history.js`** — unclosed string literals (`'invSymbol;`) at lines 47/173/298 caused a SyntaxError that killed the whole `js/app.js` module graph (app would not load at all). Repaired; chart tick callbacks now use a single in-scope currency symbol.
- [x] **BUG-09 email/PDF totals** — `recalculateTotals()` (invoices.js) taxed the pre-discount subtotal; now matches the frontend (tax on post-discount subtotal). Verified identical across tax/discount cases.
- [x] Backend tests: fixed `invoice.test.js` (`require()` of ESM → `.default`) and `actionLimit.test.js` (date-change assertion now 1, matching the middleware). Full suite: 106/106 passing.
