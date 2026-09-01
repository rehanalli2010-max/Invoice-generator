/**
 * Loading Spinner Overlay
 * Shows a full-screen loading overlay with animated spinner during async operations.
 */
const Loading = {
    overlay: null,
    count: 0,

    init() {
        if (this.overlay) return;

        this.overlay = document.createElement('div');
        this.overlay.className = 'loading-overlay';
        this.overlay.id = 'loadingOverlay';
        this.overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner">
                    <svg viewBox="0 0 50 50">
                        <circle class="loading-circle" cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                    </svg>
                </div>
                <div class="loading-text">Loading...</div>
            </div>
        `;
        document.body.appendChild(this.overlay);
    },

    show(message = 'Loading...') {
        this.init();
        this.count++;

        const textEl = this.overlay.querySelector('.loading-text');
        if (textEl) textEl.textContent = message;

        this.overlay.classList.add('loading-active');
        document.body.style.overflow = 'hidden';
    },

    hide() {
        if (!this.overlay) return;

        this.count = Math.max(0, this.count - 1);

        if (this.count === 0) {
            this.overlay.classList.remove('loading-active');
            document.body.style.overflow = '';
        }
    },

    forceHide() {
        this.count = 0;
        if (this.overlay) {
            this.overlay.classList.remove('loading-active');
            document.body.style.overflow = '';
        }
    }
};

window.Loading = Loading;
