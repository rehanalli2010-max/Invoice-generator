/**
 * Migration & Ads Module
 * Handles migration prompt, interstitial ads, and config loading
 */

export function showMigrationPrompt() {
    if (this._migrationPromptShown || this.user || !this.hasLocalInvoices()) return;
    this._migrationPromptShown = true;
    const banner = document.getElementById('migrationBanner');
    if (banner) banner.style.display = '';
}

export function dismissMigration() {
    const banner = document.getElementById('migrationBanner');
    if (banner) banner.style.display = 'none';
    sessionStorage.setItem('migration-dismissed', '1');
}

export function shouldShowMigration() {
    if (this.user) return false;
    if (sessionStorage.getItem('migration-dismissed')) return false;
    return this.hasLocalInvoices();
}

export function hasLocalInvoices() {
    return this.storage.getInvoices().length > 0;
}

let _interstitialInterval = null;

export function showInterstitialAd() {
    return new Promise((resolve) => {
        const overlay = document.getElementById('interstitialAd');
        const timerEl = document.getElementById('adTimer');
        const skipBtn = document.getElementById('adSkipBtn');
        let seconds = 5;
        skipBtn.disabled = true;
        skipBtn.textContent = `Skip Ad \u2193`;
        timerEl.textContent = seconds;
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';

        // Clear any previous interval to prevent accumulation
        if (_interstitialInterval) {
            clearInterval(_interstitialInterval);
            _interstitialInterval = null;
        }

        // Remove any previously attached listeners to prevent accumulation
        const newSkipBtn = skipBtn.cloneNode(true);
        skipBtn.parentNode.replaceChild(newSkipBtn, skipBtn);

        _interstitialInterval = setInterval(() => {
            seconds--;
            timerEl.textContent = seconds;
            if (seconds <= 0) {
                clearInterval(_interstitialInterval);
                _interstitialInterval = null;
                newSkipBtn.disabled = false;
                newSkipBtn.textContent = 'Close & Download \u2193';
            }
        }, 1000);

        const cleanup = () => {
            if (_interstitialInterval) {
                clearInterval(_interstitialInterval);
                _interstitialInterval = null;
            }
            overlay.classList.remove('show');
            document.body.style.overflow = '';
            newSkipBtn.removeEventListener('click', onSkip);
            overlay.removeEventListener('click', onBackdrop);
            resolve();
        };

        const onSkip = () => { if (!newSkipBtn.disabled) cleanup(); };
        const onBackdrop = (e) => { if (e.target === overlay && !newSkipBtn.disabled) cleanup(); };

        newSkipBtn.addEventListener('click', onSkip);
        overlay.addEventListener('click', onBackdrop);
    });
}

export function skipInterstitial() {
    const overlay = document.getElementById('interstitialAd');
    const skipBtn = document.getElementById('adSkipBtn');
    if (!skipBtn.disabled) {
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }
}

export async function loadConfig() {
    try {
        const res = await fetch(`${window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin}/api/config`);
        if (!res.ok) return;
        const config = await res.json().catch(() => ({}));
        if (config.googleAdSense?.client) {
            const script = document.createElement('script');
            script.async = true;
            script.crossOrigin = 'anonymous';
            script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.googleAdSense.client}`;
            document.head.appendChild(script);
            window.adsbygoogle = window.adsbygoogle || [];
        }
        if (config.oauth?.googleClientId) {
            window._GOOGLE_CLIENT_ID = config.oauth.googleClientId;
        }
        if (config.oauth?.githubClientId) {
            window._GITHUB_CLIENT_ID = config.oauth.githubClientId;
        }
    } catch (e) {
        // Config load failed silently
    }
}
