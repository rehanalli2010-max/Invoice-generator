export const pricing = {
    token: localStorage.getItem('invoice-auth-token'),
    user: null,
    annual: false,
    API_BASE: window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin,

    async init() {
        const toggle = document.getElementById('billingToggle');
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                this.annual = e.target.checked;
                this.updatePrices();
            });
        }
        
        if (this.token) {
            await this.fetchUser();
        } else {
            this.updateUI();
        }
    },

    async fetchUser() {
        try {
            const res = await fetch(`${this.API_BASE}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                this.user = data.user;
            } else {
                this.user = null;
                this.token = null;
                localStorage.removeItem('invoice-auth-token');
            }
        } catch {
            this.user = null;
        }
        this.updateUI();
    },

    updatePrices() {
        const proMonthly = 9;
        const proAnnual = 7;
        const bizMonthly = 19;
        const bizAnnual = 15;

        const proEl = document.getElementById('pro-price');
        if (proEl) proEl.textContent = this.annual ? proAnnual : proMonthly;
        const proNote = document.getElementById('pro-annual-note');
        if (proNote) proNote.textContent = this.annual ? `$${proAnnual * 12}/yr billed annually` : ' ';

        const bizEl = document.getElementById('biz-price');
        if (bizEl) bizEl.textContent = this.annual ? bizAnnual : bizMonthly;
        const bizNote = document.getElementById('biz-annual-note');
        if (bizNote) bizNote.textContent = this.annual ? `$${bizAnnual * 12}/yr billed annually` : ' ';

        const monthlyLbl = document.getElementById('monthlyLabel');
        const annualLbl = document.getElementById('annualLabel');
        if (monthlyLbl) monthlyLbl.classList.toggle('active', !this.annual);
        if (annualLbl) annualLbl.classList.toggle('active', this.annual);
    },

    updateUI() {
        const tier = this.user?.tier || 'free';
        const isFree = tier === 'free';
        const isPro = tier === 'pro';
        const isBusiness = tier === 'business';

        // Free card
        const freeCard = document.getElementById('card-free');
        if (freeCard) {
            const freeBadge = freeCard.querySelector('.current-plan-badge');
            const freeBtn = document.getElementById('btn-free');
            if (isFree) {
                if (!freeBadge) {
                    const badge = document.createElement('div');
                    badge.className = 'current-plan-badge';
                    badge.textContent = 'Current Plan';
                    freeCard.prepend(badge);
                }
                if (freeBtn) {
                    freeBtn.textContent = 'Current Plan';
                    freeBtn.className = 'btn-card manage';
                }
            } else {
                if (freeBadge) freeBadge.remove();
                if (freeBtn) {
                    freeBtn.textContent = 'Downgrade';
                    freeBtn.className = 'btn-card manage';
                }
            }
        }

        // Pro card
        const proCard = document.getElementById('card-pro');
        if (proCard) {
            const proBadge = proCard.querySelector('.current-plan-badge');
            const proPrompt = document.getElementById('pro-auth-prompt');
            const proActions = document.getElementById('pro-actions');

            if (isPro) {
                if (!proBadge) {
                    const badge = document.createElement('div');
                    badge.className = 'current-plan-badge';
                    badge.textContent = 'Current Plan';
                    proCard.prepend(badge);
                }
            } else {
                if (proBadge) proBadge.remove();
            }

            if (!this.token) {
                if (proPrompt) proPrompt.style.display = '';
                if (proActions) proActions.style.display = 'none';
            } else {
                if (proPrompt) proPrompt.style.display = 'none';
                if (proActions) proActions.style.display = '';

                const proBtn = document.getElementById('btn-pro');
                if (proBtn) {
                    if (isPro) {
                        proBtn.textContent = 'Current Plan';
                        proBtn.className = 'btn-card manage';
                        proBtn.onclick = () => pricing.handlePortal();
                    } else if (isBusiness) {
                        proBtn.textContent = 'Downgrade';
                        proBtn.className = 'btn-card manage';
                        proBtn.onclick = () => pricing.handleSubscribe('pro');
                    } else {
                        proBtn.textContent = 'Subscribe';
                        proBtn.className = 'btn-card primary';
                        proBtn.onclick = () => pricing.handleSubscribe('pro');
                    }
                }
            }
        }

        // Business card
        const bizCard = document.getElementById('card-business');
        if (bizCard) {
            const bizBadge = bizCard.querySelector('.current-plan-badge');
            const bizPrompt = document.getElementById('biz-auth-prompt');
            const bizActions = document.getElementById('biz-actions');

            if (isBusiness) {
                if (!bizBadge) {
                    const badge = document.createElement('div');
                    badge.className = 'current-plan-badge';
                    badge.textContent = 'Current Plan';
                    bizCard.prepend(badge);
                }
            } else {
                if (bizBadge) bizBadge.remove();
            }

            if (!this.token) {
                if (bizPrompt) bizPrompt.style.display = '';
                if (bizActions) bizActions.style.display = 'none';
            } else {
                if (bizPrompt) bizPrompt.style.display = 'none';
                if (bizActions) bizActions.style.display = '';

                const bizBtn = document.getElementById('btn-biz');
                if (bizBtn) {
                    if (isBusiness) {
                        bizBtn.textContent = 'Current Plan';
                        bizBtn.className = 'btn-card manage';
                        bizBtn.onclick = () => pricing.handlePortal();
                    } else if (isPro) {
                        bizBtn.textContent = 'Upgrade';
                        bizBtn.className = 'btn-card primary';
                        bizBtn.onclick = () => pricing.handleSubscribe('business');
                    } else {
                        bizBtn.textContent = 'Subscribe';
                        bizBtn.className = 'btn-card primary';
                        bizBtn.onclick = () => pricing.handleSubscribe('business');
                    }
                }
            }
        }
    },

    handleFree() {
        if (!this.token) {
            if (window.app) { window.app.openAuthModal(); } else { window.location.href = 'index.html'; }
            return;
        }
        if (this.user?.tier === 'free') return;
        if (this.user?.stripeSubscriptionId) {
            this.handlePortal();
        }
    },
    async handleSubscribe(tier) {
        if (!this.token) {
            if (window.app) { window.app.openAuthModal(); } else { window.location.href = 'index.html'; }
            return;
        }
        try {
            const res = await fetch(`${this.API_BASE}/api/subscription/checkout`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier, interval: this.annual ? 'annual' : 'monthly' })
            });
            const data = await res.json();
            if (res.ok && data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || 'Failed to start checkout');
            }
        } catch {
            alert('Network error. Please try again.');
        }
    },
    async handlePortal() {
        if (!this.token) return;
        try {
            const res = await fetch(`${this.API_BASE}/api/subscription/portal`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const data = await res.json();
            if (res.ok && data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || 'Failed to open billing portal');
            }
        } catch {
            alert('Network error. Please try again.');
        }
    }
};
window.pricing = pricing;
pricing.init();
