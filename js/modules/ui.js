/**
 * UI Utilities Module
 * Handles notifications, modals, auto-save, event listeners, custom selects, and theme
 */

import { debounce } from '../utils.js';

const _debouncedUpdateItem = debounce((self, target) => {
    if (typeof self.updateItemFromRow === 'function') {
        self.updateItemFromRow(target);
    }
}, 50);

export function showConfirm(message, options = {}) {
    // Cancel any previously open confirm dialog to prevent listener accumulation
    if (window._confirmCleanup) {
        window._confirmCleanup(false);
        window._confirmCleanup = null;
    }

    const { showDontAskAgain = false } = options;

    return new Promise(resolve => {
        const modal = document.getElementById('confirmModal');
        const msgEl = document.getElementById('confirmModalMessage');
        const okBtn = document.getElementById('confirmModalOk');
        const cancelBtn = document.getElementById('confirmModalCancel');
        const dontAskLabel = document.getElementById('confirmModalDontAsk');
        const dontAskCheckbox = document.getElementById('confirmModalDontAskCheckbox');

        msgEl.textContent = message;
        dontAskLabel.style.display = showDontAskAgain ? 'block' : 'none';
        dontAskCheckbox.checked = false;
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        if (window._focusModal) window._focusModal(modal);

        const cleanup = (result) => {
            window._confirmCleanup = null;
            modal.classList.remove('show');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            modal.removeEventListener('click', onBackdrop);
            document.removeEventListener('keydown', onKey);
            if (window._restoreFocus) window._restoreFocus();
            resolve(result);
        };

        window._confirmCleanup = cleanup;

        const onOk = () => cleanup({ confirmed: true, dontAskAgain: dontAskCheckbox.checked });
        const onCancel = () => cleanup({ confirmed: false, dontAskAgain: dontAskCheckbox.checked });
        const onBackdrop = (e) => { if (e.target === modal) cleanup({ confirmed: false, dontAskAgain: false }); };
        const onKey = (e) => {
            if (e.key === 'Escape') cleanup({ confirmed: false, dontAskAgain: false });
        };

        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
        modal.addEventListener('click', onBackdrop);
        document.addEventListener('keydown', onKey);
    });
}

export function showNotification(message, type = 'info') {
    // Remove all existing notifications to prevent race conditions
    document.querySelectorAll('.notification').forEach(el => el.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');
    notification.textContent = message;
    document.body.appendChild(notification);

    requestAnimationFrame(() => {
        notification.classList.add('show');
    });

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

export function showAutoSaveIndicator() {
    const existing = document.querySelector('.auto-save-indicator');
    if (existing) existing.remove();

    const indicator = document.createElement('div');
    indicator.className = 'auto-save-indicator';
    indicator.textContent = 'Draft auto-saved';
    document.body.appendChild(indicator);

    requestAnimationFrame(() => {
        indicator.classList.add('show');
    });

    setTimeout(() => {
        indicator.classList.remove('show');
        setTimeout(() => indicator.remove(), 300);
    }, 2000);
}

export function setupAutoSave() {
    if (this._autoSaveInterval) clearInterval(this._autoSaveInterval);
    this._autoSaveInterval = setInterval(() => {
        if (this._saving) return;
        if (this.isFormDirty() && this.invoice && this.invoice.invoiceNumber) {
            this.autoSaveDraft();
        }
    }, 30000);
}

export function clearAutoSave() {
    if (this._autoSaveInterval) {
        clearInterval(this._autoSaveInterval);
        this._autoSaveInterval = null;
    }
}

export function setupModalKeyboardHandling() {
    const historyModal = document.getElementById('historyModal');
    const clientModal = document.getElementById('clientModal');
    const confirmModal = document.getElementById('confirmModal');
    const authModal = document.getElementById('authModal');

    let previousFocus = null;

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (confirmModal && confirmModal.classList.contains('show')) return;
            if (authModal && authModal.classList.contains('show')) {
                this.closeAuthUI();
                if (previousFocus) { previousFocus.focus(); previousFocus = null; }
                return;
            }
            if (historyModal && historyModal.classList.contains('show')) {
                this.closeModal();
                if (previousFocus) { previousFocus.focus(); previousFocus = null; }
                return;
            }
            if (clientModal && clientModal.classList.contains('show')) {
                this.closeClientModal();
                if (previousFocus) { previousFocus.focus(); previousFocus = null; }
            }
        }

        if (e.key === 'Tab') {
            const activeModal = document.querySelector('.modal.show, .ad-interstitial.show');
            if (activeModal) {
                const focusableElements = activeModal.querySelectorAll(
                    'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (focusableElements.length === 0) return;
                const firstFocusable = focusableElements[0];
                const lastFocusable = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        }
    });

    document.addEventListener('focusin', (e) => {
        const modal = e.target.closest('.modal.show, .ad-interstitial.show');
        if (modal) {
            previousFocus = document.activeElement;
        }
    });

    window._focusModal = (modalEl) => {
        previousFocus = document.activeElement;
        requestAnimationFrame(() => {
            const firstFocusable = modalEl.querySelector('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (firstFocusable) firstFocusable.focus();
        });
    };

    window._restoreFocus = () => {
        if (previousFocus) {
            previousFocus.focus();
            previousFocus = null;
        }
    };
}

export function setupEventListeners() {
    if (this._eventListenersSetup) return;
    this._eventListenersSetup = true;

    const formInputs = document.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        if (input.closest('.items-list')) return;
        if (input.id === 'taxType' || input.id === 'taxRate' || input.id === 'discountType' || input.id === 'discountValue') return;
        input.addEventListener('change', () => this.updateInvoiceFromForm());
        if (input.type !== 'date') {
            input.addEventListener('input', () => this.updateInvoiceFromForm());
        }
    });

    // Use document-level delegation for item inputs - catches all events reliably
    const handleItemInput = (e) => {
        if (e.target.closest('#itemsTableBody') && e.target.matches('.item-description, .item-quantity, .item-unit-price, .item-unit')) {
            _debouncedUpdateItem(this, e.target);
        }
    };
    
    const handleItemKeyup = (e) => {
        if (e.target.closest('#itemsTableBody') && e.target.matches('.item-quantity, .item-unit-price')) {
            _debouncedUpdateItem(this, e.target);
        }
    };

    document.addEventListener('input', handleItemInput);
    document.addEventListener('keyup', handleItemKeyup);
    
    // Also catch blur for number spinners (capture phase)
    document.addEventListener('blur', (e) => {
        if (e.target.closest('#itemsTableBody') && e.target.matches('.item-quantity, .item-unit-price')) {
            _debouncedUpdateItem(this, e.target);
        }
    }, true);

    document.getElementById('currency')?.addEventListener('change', () => this.updateTotals());
    document.getElementById('taxType')?.addEventListener('change', () => this.updateTaxDisplay());
    document.getElementById('discountType')?.addEventListener('change', () => this.updateDiscountDisplay());
    document.getElementById('taxRate')?.addEventListener('input', () => this.updateTotals());
    document.getElementById('discountValue')?.addEventListener('input', () => this.updateTotals());

    document.getElementById('taxRate')?.addEventListener('change', () => this.clampTaxRate());
    document.getElementById('discountValue')?.addEventListener('change', () => this.clampDiscountValue());

    // Required field validation listeners
    const requiredInputs = document.querySelectorAll('input[required]');
    requiredInputs.forEach(input => {
        input.addEventListener('blur', () => this.validateField(input));
        input.addEventListener('input', () => {
            if (input.classList.contains('is-invalid')) {
                this.validateField(input);
            }
        });
    });
}

export function setupScrollListener() {
    if (this._scrollListenerSetup) return;
    this._scrollListenerSetup = true;
    const header = document.querySelector('.header');
    if (!header) return;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

export function initCustomSelects() {
    // Clean up any existing observers first
    if (window._customSelectObservers) {
        window._customSelectObservers.forEach(observer => observer.disconnect());
        window._customSelectObservers = [];
    }
    if (window._customSelectsInitialized) return;
    window._customSelectsInitialized = true;
    window._customSelectObservers = window._customSelectObservers || [];
    document.querySelectorAll('.custom-select').forEach(container => {
        const nativeSelect = container.querySelector('select');
        const trigger = container.querySelector('.custom-select-trigger');
        const optionsList = container.querySelector('.custom-select-options');
        const valueEl = container.querySelector('.custom-select-value');
        if (!optionsList || !nativeSelect) return;

        const populateOptions = () => {
            optionsList.innerHTML = '';
            Array.from(nativeSelect.options).forEach(opt => {
                const li = document.createElement('li');
                li.className = 'custom-select-option';
                li.textContent = opt.textContent;
                li.dataset.value = opt.value;
                li.setAttribute('role', 'option');
                if (opt.value === nativeSelect.value) {
                    li.classList.add('selected');
                    valueEl.textContent = opt.textContent;
                }
                li.addEventListener('click', () => {
                    nativeSelect.value = opt.value;
                    valueEl.textContent = opt.textContent;
                    optionsList.querySelectorAll('.custom-select-option').forEach(o => o.classList.remove('selected'));
                    li.classList.add('selected');
                    container.classList.remove('open');
                    trigger.setAttribute('aria-expanded', 'false');
                    nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
                });
                li.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        li.click();
                    }
                });
                optionsList.appendChild(li);
            });
        };

        populateOptions();

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.custom-select.open').forEach(c => {
                if (c !== container) {
                    c.classList.remove('open');
                    c.querySelector('.custom-select-trigger').setAttribute('aria-expanded', 'false');
                }
            });
            container.classList.toggle('open');
            trigger.setAttribute('aria-expanded', container.classList.contains('open'));
        });

        trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                trigger.click();
            } else if (e.key === 'Escape') {
                container.classList.remove('open');
                trigger.setAttribute('aria-expanded', 'false');
            } else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && container.classList.contains('open')) {
                e.preventDefault();
                const options = optionsList.querySelectorAll('.custom-select-option');
                const selected = optionsList.querySelector('.custom-select-option.selected');
                let index = Array.from(options).indexOf(selected);
                if (e.key === 'ArrowDown') {
                    index = (index + 1) % options.length;
                } else {
                    index = (index - 1 + options.length) % options.length;
                }
                options.forEach((opt, i) => {
                    opt.classList.toggle('selected', i === index);
                });
                if (options[index]) {
                    options[index].scrollIntoView({ block: 'nearest' });
                }
            }
        });

        const observer = new MutationObserver(() => populateOptions());
        observer.observe(nativeSelect, { childList: true });
        window._customSelectObservers.push(observer);
    });

    if (!window._customSelectDocClickListener) {
        window._customSelectDocClickListener = true;
        document.addEventListener('click', () => {
            document.querySelectorAll('.custom-select.open').forEach(c => {
                c.classList.remove('open');
                c.querySelector('.custom-select-trigger').setAttribute('aria-expanded', 'false');
            });
        });
    }
}

export function cleanupCustomSelects() {
    if (window._customSelectObservers) {
        window._customSelectObservers.forEach(observer => observer.disconnect());
        window._customSelectObservers = [];
    }
    window._customSelectsInitialized = false;
}

export function syncCustomSelects() {
    document.querySelectorAll('.custom-select').forEach(container => {
        const nativeSelect = container.querySelector('select');
        const valueEl = container.querySelector('.custom-select-value');
        const optionsList = container.querySelector('.custom-select-options');
        const selectedOpt = nativeSelect.options[nativeSelect.selectedIndex];
        if (selectedOpt) {
            valueEl.textContent = selectedOpt.textContent;
        }
        optionsList.querySelectorAll('.custom-select-option').forEach(li => {
            li.classList.toggle('selected', li.dataset.value === nativeSelect.value);
        });
    });
}

export function selectThemeSwatch(el) {
    const theme = el.dataset.theme;
    document.querySelectorAll('.theme-swatch').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('themeSelect').value = theme;
    this.applyTheme();
}

export function applyTheme() {
    const theme = document.getElementById('themeSelect').value;
    const body = document.body;
    body.classList.remove('theme-slate', 'theme-emerald', 'theme-navy', 'theme-cyberpunk');
    if (theme !== 'default') {
        body.classList.add(theme);
    }
    localStorage.setItem('invoice-theme', theme);
}

export function setThemeMode(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('theme-mode', mode);
}


export function updateHeader(title, subtitle) {
    const titleEl = document.getElementById('headerTitle');
    const subtitleEl = document.getElementById('headerSubtitle');
    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;
}


export function showTemplatesView() {
    switchView("templates");
    // Initialize templates page after view switch
    if (typeof window.app.initTemplatesPage === "function") {
        setTimeout(() => window.app.initTemplatesPage(), 50);
    }
}

export function showPricingView() {
    switchView("pricing");
    // Initialize pricing after view switch
    if (typeof window.pricing !== "undefined" && typeof window.pricing.init === "function") {
        setTimeout(() => window.pricing.init(), 50);
    }
}

export async function showDashboardView() {
    clearAutoSave.call(this);
    switchView("home");
    // Render dashboard charts when showing the dashboard view
    if (typeof this.renderDashboard === "function") {
        await this.renderDashboard(this);
    }
}

export function showInvoiceView() {
    switchView("new-invoice");
}



export function hideAllViews() {
    const views = ['home', 'new-invoice', 'history', 'clients', 'templates', 'pricing'];
    views.forEach(v => {
        const el = document.getElementById(v);
        if (el) {
            el.classList.remove('active');
            el.style.display = 'none';
        }
    });
    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.innerWidth <= 768) sidebar.classList.remove('open');

    // Destroy dashboard instance to clean up charts and event listeners
    if (window.app && window.app.dashboard) {
        window.app.dashboard.destroy();
        window.app.dashboard = null;
    }

    // Reset form dirty state and suppress preview flag
    if (window.app) {
        window.app._suppressPreview = false;
    }
}

export function setActiveNav(navId) {
    document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
    const activeLink = document.getElementById(navId);
    // Some links might not have IDs in standard sidebar, this ensures at least it cleans up old ones
    if (activeLink) {
        activeLink.classList.add('active');
    }
}


export function loadThemePreference() {
    const savedMode = localStorage.getItem('theme-mode') || 'dark';
    document.documentElement.setAttribute('data-theme', savedMode);

    const savedTheme = localStorage.getItem('invoice-theme') || 'default';
    const body = document.body;
    body.classList.remove('theme-slate', 'theme-emerald', 'theme-navy', 'theme-cyberpunk');
    if (savedTheme !== 'default') {
        body.classList.add(savedTheme);
    }

    document.querySelectorAll('.theme-swatch').forEach(s => {
        s.classList.toggle('active', s.dataset.theme === savedTheme);
    });
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) themeSelect.value = savedTheme;
}




export function switchView(viewId) {
    hideAllViews();
    const view = document.getElementById(viewId);
    if (view) {
        document.querySelectorAll(".page-section").forEach(el => el.classList.remove("active"));
        view.style.display = "block";
        setTimeout(() => view.classList.add("active"), 10);
    }

    // Update active nav based on viewId
    let navId = "";
    let title = "Invoice Generator";
    let subtitle = "Professional invoice creation made easy";

    if (viewId === "home" || viewId === "dashboard" || viewId === "navDashboard") {
        navId = "navDashboard";
        title = "Dashboard";
        subtitle = "Track your business performance and insights";
    } else if (viewId === "new-invoice") {
        navId = "navInvoice";
        title = "New Invoice";
        subtitle = "Create a new professional invoice";
    } else if (viewId === "history") {
        navId = "navHistory";
        title = "Invoice History";
        subtitle = "View and manage past invoices";
    } else if (viewId === "clients") {
        navId = "navClients";
        title = "Clients";
        subtitle = "Manage your clients";
    } else if (viewId === "templates") {
        navId = "navTemplates";
        title = "Templates";
        subtitle = "Customize your invoice appearance";
    } else if (viewId === "pricing") {
        navId = "navPricing";
        title = "Pricing";
        subtitle = "Simple, transparent pricing for every stage.";
    }

    if (navId) {
        setActiveNav(navId);
    } else {
        document.querySelectorAll(".sidebar-link").forEach(link => link.classList.remove("active"));
    }
    updateHeader(title, subtitle);
}