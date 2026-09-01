/**
 * Toast Notification System
 * Provides animated toast notifications for success, error, info, and warning messages.
 */
const Toast = {
    container: null,
    toasts: [],
    maxToasts: 5,

    init() {
        if (this.container) return;
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        this.container.id = 'toastContainer';
        document.body.appendChild(this.container);
    },

    show(message, type = 'info', title = null, duration = 4000) {
        this.init();

        // Remove oldest toast if at max
        while (this.toasts.length >= this.maxToasts) {
            const oldest = this.toasts.shift();
            this._removeToast(oldest);
        }

        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
            error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
        };

        const defaultTitles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Info'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');

        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-content">
                <div class="toast-title">${title || defaultTitles[type]}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="Dismiss">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            <div class="toast-progress"></div>
        `;

        // Close button handler
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this._removeToast(toast));

        // Progress bar animation
        const progress = toast.querySelector('.toast-progress');
        progress.style.animationDuration = `${duration}ms`;

        // Auto-dismiss
        const timeoutId = setTimeout(() => this._removeToast(toast), duration);
        toast._timeoutId = timeoutId;

        this.container.appendChild(toast);
        this.toasts.push(toast);

        // Trigger animation
        requestAnimationFrame(() => toast.classList.add('toast-show'));

        return toast;
    },

    success(message, title) {
        return this.show(message, 'success', title, 4000);
    },

    error(message, title) {
        return this.show(message, 'error', title, 6000);
    },

    warning(message, title) {
        return this.show(message, 'warning', title, 5000);
    },

    info(message, title) {
        return this.show(message, 'info', title, 4000);
    },

    _removeToast(toast) {
        if (!toast || !toast.parentNode) return;

        clearTimeout(toast._timeoutId);
        toast.classList.add('toast-hide');

        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            const idx = this.toasts.indexOf(toast);
            if (idx > -1) this.toasts.splice(idx, 1);
        }, 300);
    },

    dismissAll() {
        [...this.toasts].forEach(toast => this._removeToast(toast));
    }
};

window.Toast = Toast;
