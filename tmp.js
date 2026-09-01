import { API_BASE } from './config.js';
import { initAuth, updateAuthUI, showAuthModal, switchAuthTab, handleLogin, handleRegister, closeAuthUI, logout, refreshUser, openPortal, importLocalOnLogin, showForgotPassword, showForgotPasswordBack, handleForgotPassword, showResetPassword, handleResetPassword, initResetPassword, deleteAccount } from './modules/auth.js';
import { apiRequest, apiGetInvoices, apiSaveInvoice, apiDeleteInvoice, apiImportInvoices, apiGetClients, apiSaveClient, apiDeleteClient, apiImportClients, apiSendInvoice, apiDuplicateInvoice, apiUpdateInvoiceStatus, apiGetEmailConfig, apiSaveEmailConfig, apiDeleteEmailConfig, apiConvertToInvoice } from './modules/api.js';
import { addItem, removeItem, updateItemFromRow, updateItemAmount, loadInvoice, loadLastDraft, saveDraft, saveInvoice, resetForm, updatePreview, updateTotals, updateInvoiceFromForm, updateRecurringPreview } from './modules/invoice-ui.js';
import { showInvoiceHistory, closeModal, renderHistoryList, renderHistoryItem, updateAnalyticsDashboard, searchHistory, filterHistory, loadInvoiceById, deleteInvoiceFromHistory, clearAllData, togglePaymentStatus, generateNextInvoice, renderCharts, toggleAllInvoices, updateInvoiceStatus, showEmailConfigModal, duplicateInvoice, sendInvoiceToClient, convertToInvoice, generatePayLink, filterByDateRange, getDateFilteredInvoices, renderMonthlyHeatmap } from './modules/history.js';
import { saveClient, loadClient, showClientManager, closeClientModal, renderClientDropdown, renderClientList, searchClients, loadClientById, deleteClientById, addClient } from './modules/clients.js';
import { showProductCatalog, closeProductCatalog, renderProductCatalog, renderSavedProductsDropdown, addProductToInvoice, saveCurrentItemToCatalog, deleteProductById, addProductFromSaved } from './modules/products.js';
import { showConfirm, showNotification, showAutoSaveIndicator, setupAutoSave, setupModalKeyboardHandling, setupEventListeners, setupScrollListener, initCustomSelects, syncCustomSelects, selectThemeSwatch, applyTheme, setThemeMode, loadThemePreference, showDashboardView, showInvoiceView, hideAllViews, setActiveNav, updateHeader, switchView } from './modules/ui.js';
import { showMigrationPrompt, dismissMigration, shouldShowMigration, hasLocalInvoices, showInterstitialAd, skipInterstitial, loadConfig } from './modules/migration.js';
import { renderDashboard, renderRevenueSmallChart, renderStatusSmallChart, renderRevenueCostsChart, renderTopClients, renderPerClientIncomeChart, renderKeyInsightsChart, renderProjectedEarningsChart, renderARAgingChart } from './modules/dashboard.js';
import { showSettingsModal } from './modules/settings.js';
import { connectWebSocket, disconnectWebSocket, onEvent } from './modules/websocket-client.js';
import Invoice from './invoice.js';
import InvoiceStorage from './storage.js';
import i18n from './i18n.js';
import { Typewriter, showTypewriter } from './typewriter.js';
import { generateId } from './utils.js';

import { convertToCSV } from './utils.js';

// Error boundary utility
function safeWrap(fn, context, name) {
    return function (...args) {
        try {
            const result = fn.apply(context, args);
            // Catch async rejections too (most render/handlers are async)
            if (result && typeof result.then === 'function') {
                return result.catch((e) => {
                    console.error(`[ErrorBoundary] ${name || fn.name || 'anonymous'} rejected:`, e);
                    if (context && typeof context.showNotification === 'function') {
                        context.showNotification(`Something went wrong: ${e.message}`, 'error');
                    }
                });
            }
            return result;
        } catch (e) {
            console.error(`[ErrorBoundary] ${name || fn.name || 'anonymous'} failed:`, e);
            if (context && typeof context.showNotification === 'function') {
                context.showNotification(`Something went wrong: ${e.message}`, 'error');
            }
        }
    };
}

// Import module functions

const app = {
    savePrice(target, itemId) {
        const row = target.closest('.item-row');
        let desc = 'Unknown item';
        let price = 0;
        if(row) {
            desc = (row.querySelector('.item-description').value || 'Unknown item').trim();
            const priceVal = row.querySelector('.item-unit-price').value;
            price = parseFloat(String(priceVal).replace(',', '.')) || 0;
        }
        if(desc && price >= 0) {
            // Use standard localStorage or whatever storage you prefer
            const savedPricesStr = localStorage.getItem('savedPrices');
            const savedPrices = savedPricesStr ? JSON.parse(savedPricesStr) : {};
            savedPrices[desc] = {
                price: price,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem('savedPrices', JSON.stringify(savedPrices));

            // Force an update to the current invoice item - read ALL fields from DOM
            if (this.invoice && itemId && row) {
                const quantity = parseFloat(row.querySelector('.item-quantity')?.value) || 0;
                const unit = row.querySelector('.item-unit')?.value || 'Qty';
                this.invoice.updateItem(itemId, { description: desc, quantity, unitPrice: price, unit });
                if (!this._suppressPreview && typeof this.updatePreview === 'function') {
                    this.updatePreview();
                }
            }

            this.showNotification(`Saved price for ${desc}: ${price}`, 'success');
        } else {
           this.showNotification(`Cannot save invalid price`, 'error');
        }
    },
    invoice: null,
    storage: new InvoiceStorage(),
    user: null,
    token: localStorage.getItem('invoice-auth-token'),
    apiInvoices: [],
    apiClients: [],
    _migrationPromptShown: false,
    _backendAvailable: null,
    _saving: false,

    // --- Core Entry Point ---
    async init() {
        // Phase 1: Synchronous setup (no network calls)
        const syncSteps = [
            ['loadThemePreference', () => this.loadThemePreference()],
            ['createInvoice', () => { this.invoice = new Invoice(); }],
            ['setupEventListeners', () => this.setupEventListeners()],
            ['initializeForm', () => this.initializeForm()],
            ['setTodayDates', () => this.setTodayDates()],
            ['addFirstItem', () => { if (this.invoice.items.length === 0) this.addItem(); }],
            ['initSignaturePad', () => this.initSignaturePad()],
            ['loadCompanyTemplates', () => this.loadCompanyTemplates()],
            ['initCustomSelects', () => this.initCustomSelects()],
            ['updateInvoiceFromForm', () => this.updateInvoiceFromForm()],
            ['setupModalKeyboardHandling', () => this.setupModalKeyboardHandling()],
            ['setupAutoSave', () => this.setupAutoSave()],
            ['setupScrollListener', () => this.setupScrollListener()],
            ['initLocaleSwitcher', () => this.initLocaleSwitcher()],
            ['initTemplatesPage', () => { if(typeof this.initTemplatesPage === 'function') this.initTemplatesPage() }]
        ];
        for (const [name, fn] of syncSteps) {
            try {
                fn();
            } catch (e) {
                console.error(`[ErrorBoundary] init.${name} failed:`, e);
                this.showNotification(`Error during ${name}: ${e.message}`, 'error');
            }
        }

        // Phase 2: Async initialization - auth must complete first
        try {
            await this.initAuth();
        } catch (e) {
            console.error('[ErrorBoundary] init.initAuth failed:', e);
            this.showNotification(`Error during initAuth: ${e.message}`, 'error');
        }

        // Phase 3: Post-auth initialization (only if not already done by initAuth)
        // Note: initAuth already calls apiGetInvoices, apiGetClients, renderClientDropdown,
        // renderHistoryList, updateAnalyticsDashboard when token is valid
        if (!this.token) {
            // No auth token - render local data
            try {
                this.renderClientDropdown();
                await this.loadInvoiceHistory();
            } catch (e) {
                console.error('[ErrorBoundary] init.postAuth failed:', e);
            }
        }

        // Phase 4: Render dashboard (initAuth already does this for authenticated users)
        if (!this.token) {
            try {
                this.renderDashboard();
            } catch (e) {
                console.error('[ErrorBoundary] init.renderDashboard failed:', e);
            }
        }

        // Phase 5: Reset password init (non-blocking)
        try {
            this.initResetPassword();
        } catch (e) {
            console.error('[ErrorBoundary] init.initResetPassword failed:', e);
        }

        // Phase 6: Load config (non-blocking)
        try {
            this.loadConfig();
        } catch (e) {
            console.error('[ErrorBoundary] init.loadConfig failed:', e);
        }
    },

    // --- Non-extracted Methods (remain in app.js) ---

    validateField(input) {
        if (!input.hasAttribute('required')) return true;

        let isValid = true;
        let errorMessage = 'This field is required';

        if (!input.value.trim()) {
            isValid = false;
        }

        const errorEl = input.parentElement.querySelector('.form-error');
        if (!isValid) {
            input.classList.add('is-invalid');
            if (errorEl) {
                errorEl.textContent = errorMessage;
            }
        } else {
            input.classList.remove('is-invalid');
        }

        return isValid;
    },

    validateForm(isDraft = false) {
        // Only validate inputs within the invoice form
        const formSection = document.querySelector('.form-section');
        const requiredInputs = formSection ? formSection.querySelectorAll('input[required]') : [];
        let isValid = true;

        requiredInputs.forEach(input => {
            if (isDraft && input.id !== 'invoiceNumber') {
                return;
            }
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        // Date-ordering check (if both invoiceDate and dueDate are present/valid)
        const invoiceDateEl = document.getElementById('invoiceDate');
        const dueDateEl = document.getElementById('dueDate');
        if (!isDraft && invoiceDateEl && dueDateEl && invoiceDateEl.value && dueDateEl.value) {
            if (new Date(invoiceDateEl.value) > new Date(dueDateEl.value)) {
                isValid = false;
                dueDateEl.classList.add('is-invalid');
                const errorEl = dueDateEl.parentElement.querySelector('.form-error');
                if (errorEl) {
                    errorEl.textContent = 'Due date must be after invoice date';
                }
            } else {
                dueDateEl.classList.remove('is-invalid');
                const errorEl = dueDateEl.parentElement.querySelector('.form-error');
                if (errorEl) {
                    errorEl.textContent = '';
                }
            }
        } else if (dueDateEl && !dueDateEl.value) {
            // Clear validation state when due date is empty
            dueDateEl.classList.remove('is-invalid');
            const errorEl = dueDateEl.parentElement.querySelector('.form-error');
            if (errorEl) {
                errorEl.textContent = '';
            }
        }

        return isValid;
    },

    isFormDirty() {
        const defaults = {
            companyName: 'My Company',
            companyEmail: 'company@example.com',
            companyPhone: '+1 (555) 000-0000',
            companyAddress: '123 Main St, New York, NY',
            currency: 'USD',
            paymentTerms: 'Net 30'
        };
        for (const [key, value] of Object.entries(defaults)) {
            const el = document.getElementById(key);
            if (el && el.value !== value) return true;
        }
        const clientFields = ['clientName', 'clientEmail', 'clientPhone', 'clientAddress'];
        for (const field of clientFields) {
            const el = document.getElementById(field);
            if (el && el.value.trim() !== '') return true;
        }
        if (this.invoice && this.invoice.items) {
            if (this.invoice.items.length > 1) return true;
            if (this.invoice.items.length === 1) {
                const item = this.invoice.items[0];
                if (item.description !== 'New Item' || item.quantity !== 1 || item.unitPrice !== 0 || item.unit !== 'Qty') {
                    return true;
                }
            }
        }
        return false;
    },

    initializeForm() {
        const invNumEl = document.getElementById('invoiceNumber');
        if (invNumEl) invNumEl.value = this.storage.peekNextInvoiceNumber();

        const defaults = {
            companyName: 'My Company',
            companyEmail: 'company@example.com',
            companyPhone: '+1 (555) 000-0000',
            companyAddress: '123 Main St, New York, NY',
            currency: 'USD',
            paymentTerms: 'Net 30'
        };

        for (const [key, value] of Object.entries(defaults)) {
            const element = document.getElementById(key);
            if (element) element.value = value;
        }

        this.loadLastDraft();
    },

    setTodayDates() {
        const invoiceDateEl = document.getElementById('invoiceDate');
        const dueDateEl = document.getElementById('dueDate');
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        const fpConfig = {
            dateFormat: 'Y-m-d',
            minDate: 'today',
            disableMobile: true,
            theme: 'dark',
        };

        if (invoiceDateEl) {
            if (invoiceDateEl._flatpickr) invoiceDateEl._flatpickr.destroy();
            flatpickr(invoiceDateEl, {
                ...fpConfig,
                defaultDate: invoiceDateEl.value || todayStr,
                onChange: () => {
                    if (window.app && window.app.updateRecurringPreview) {
                        window.app.updateRecurringPreview();
                    }
                },
            });
            if (!invoiceDateEl.value) invoiceDateEl.value = todayStr;
        }

        if (dueDateEl) {
            if (dueDateEl._flatpickr) dueDateEl._flatpickr.destroy();
            const dueDate = new Date(today);
            dueDate.setDate(dueDate.getDate() + 30);
            const dueStr = dueDate.toISOString().split('T')[0];
            flatpickr(dueDateEl, {
                ...fpConfig,
                defaultDate: dueDateEl.value || dueStr,
            });
            if (!dueDateEl.value) dueDateEl.value = dueStr;
        }
    },

    clampTaxRate() {
        const input = document.getElementById('taxRate');
        if (this.invoice.taxType === 'percentage') {
            let val = parseFloat(input.value) || 0;
            if (val < 0) val = 0;
            if (val > 100) val = 100;
            input.value = val;
            this.invoice.taxRate = val;
        }
    },

    clampDiscountValue() {
        const input = document.getElementById('discountValue');
        if (this.invoice.discountType === 'percentage') {
            let val = parseFloat(input.value) || 0;
            if (val < 0) val = 0;
            if (val > 100) val = 100;
            input.value = val;
            this.invoice.discountValue = val;
        }
    },

    updateTaxDisplay() {
        const taxTypeEl = document.getElementById('taxType');
        const taxRateInput = document.getElementById('taxRate');
        if (!taxTypeEl || !taxRateInput) return;
        const taxType = taxTypeEl.value;
        if (taxType === 'none') {
            taxRateInput.disabled = true;
            taxRateInput.value = 0;
        } else {
            taxRateInput.disabled = false;
            taxRateInput.placeholder = taxType === 'percentage' ? '0-100' : '0';
            taxRateInput.max = taxType === 'percentage' ? '100' : '';
        }
        if (!this._suppressPreview) this.updateTotals();
    },

    updateDiscountDisplay() {
        const discountTypeEl = document.getElementById('discountType');
        const discountInput = document.getElementById('discountValue');
        if (!discountTypeEl || !discountInput) return;
        const discountType = discountTypeEl.value;
        if (discountType === 'none') {
            discountInput.disabled = true;
            discountInput.value = 0;
        } else {
            discountInput.disabled = false;
            discountInput.placeholder = discountType === 'percentage' ? '0-100' : '0';
            discountInput.max = discountType === 'percentage' ? '100' : '';
        }
        if (!this._suppressPreview) this.updateTotals();
    },

    handleLogoUpload(event) {
        try {
            const file = event.target.files[0];
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) {
                this.showNotification('Logo file too large (max 2MB)', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    // Resize large images to avoid QuotaExceededError in localStorage
                    const img = new Image();
                    img.onload = () => {
                        try {
                            const MAX_DIM = 400;
                            let { width, height } = img;
                            if (width > MAX_DIM || height > MAX_DIM) {
                                const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
                                width = Math.round(width * ratio);
                                height = Math.round(height * ratio);
                            }
                            const canvas = document.createElement('canvas');
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);
                            const resized = canvas.toDataURL('image/png');
                            document.getElementById('companyLogoBase64').value = resized;
                            this.invoice.companyLogo = resized;
                            this.updatePreview();
                            this.showNotification('Logo uploaded', 'success');
                        } catch (err) {
                            console.error('[ErrorBoundary] handleLogoUpload resize failed:', err);
                            // Fallback to original
                            document.getElementById('companyLogoBase64').value = e.target.result;
                            this.invoice.companyLogo = e.target.result;
                            this.updatePreview();
                            this.showNotification('Logo uploaded', 'success');
                        }
                    };
                    img.onerror = () => {
                        document.getElementById('companyLogoBase64').value = e.target.result;
                        this.invoice.companyLogo = e.target.result;
                        this.updatePreview();
                        this.showNotification('Logo uploaded', 'success');
                    };
                    img.src = e.target.result;
                } catch (err) {
                    console.error('[ErrorBoundary] handleLogoUpload.onload failed:', err);
                    this.showNotification('Error processing logo', 'error');
                }
            };
            reader.onerror = () => this.showNotification('Error reading file', 'error');
            reader.readAsDataURL(file);
        } catch (e) {
            console.error('[ErrorBoundary] handleLogoUpload failed:', e);
            this.showNotification('Error uploading logo', 'error');
        }
    },

    initSignaturePad() {
        try {
            const canvas = document.getElementById('signatureCanvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            let drawing = false;
            let lastX, lastY;

            // Clean up previous resize observer if exists
            if (this._signatureObserver) {
                this._signatureObserver.disconnect();
                this._signatureObserver = null;
            }

            const resize = () => {
                try {
                    const rect = canvas.getBoundingClientRect();
                    // Don't resize to 0 if it's hidden
                    if (rect.width === 0 || rect.height === 0) return;

                    // We must redraw if there was a signature, so keep the data URL, resize, and draw image back
                    const currentSig = canvas.toDataURL();
                    canvas.width = rect.width;
                    canvas.height = rect.height;

                    if (currentSig && currentSig.length > 100) {
                        const img = new Image();
                        img.onload = () => {
                            ctx.drawImage(img, 0, 0, rect.width, rect.height);
                        };
                        img.src = currentSig;
                    }
                } catch (e) {
                    console.error('[ErrorBoundary] signature resize failed:', e);
                }
            };
            resize();
            this._signatureObserver = new ResizeObserver(() => resize());
            this._signatureObserver.observe(canvas.parentElement || canvas);

            const getPos = (e) => {
                const rect = canvas.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                return { x: clientX - rect.left, y: clientY - rect.top };
            };

            const startDraw = (e) => {
                drawing = true;
                const pos = getPos(e);
                lastX = pos.x;
                lastY = pos.y;
            };

            const draw = (e) => {
                if (!drawing) return;
                e.preventDefault();
                try {
                    const pos = getPos(e);
                    ctx.beginPath();
                    ctx.moveTo(lastX, lastY);
                    ctx.lineTo(pos.x, pos.y);
                    let strokeColor = getComputedStyle(document.documentElement).getPropertyValue('--text-main').trim();
                    if (!strokeColor || strokeColor === '') strokeColor = '#ffffff';
                    ctx.strokeStyle = strokeColor;
                    ctx.lineWidth = 2;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.stroke();
                    lastX = pos.x;
                    lastY = pos.y;
                } catch (err) {
                    console.error('[ErrorBoundary] signature draw failed:', err);
                }
            };

            const endDraw = () => {
                if (drawing) {
                    try {
                        drawing = false;
                        document.getElementById('signatureBase64').value = canvas.toDataURL();
                        this.invoice.signature = canvas.toDataURL();
                        // Update aria-label for accessibility
                        canvas.setAttribute('aria-label', 'Signature drawn');
                        const statusEl = document.getElementById('signatureStatus');
                        if (statusEl) statusEl.textContent = 'Signature drawn';

                        if (!this._suppressPreview && typeof this.updatePreview === 'function') {
                            this.updatePreview();
                        }
                    } catch (err) {
                        console.error('[ErrorBoundary] signature endDraw failed:', err);
                    }
                }
            };

            // Remove previous canvas listeners to prevent accumulation
            if (this._signatureHandlers) {
                canvas.removeEventListener('mousedown', this._signatureHandlers.startDraw);
                canvas.removeEventListener('mousemove', this._signatureHandlers.draw);
                canvas.removeEventListener('mouseup', this._signatureHandlers.endDraw);
                canvas.removeEventListener('mouseleave', this._signatureHandlers.endDraw);
                canvas.removeEventListener('touchstart', this._signatureHandlers.startDraw);
                canvas.removeEventListener('touchmove', this._signatureHandlers.draw);
                canvas.removeEventListener('touchend', this._signatureHandlers.endDraw);
            }

            canvas.addEventListener('mousedown', startDraw);
            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('mouseup', endDraw);
            canvas.addEventListener('mouseleave', endDraw);
            canvas.addEventListener('touchstart', startDraw, { passive: false });
            canvas.addEventListener('touchmove', draw, { passive: false });
            canvas.addEventListener('touchend', endDraw);

            this._signatureHandlers = { startDraw, draw, endDraw };
        } catch (e) {
            console.error('[ErrorBoundary] initSignaturePad failed:', e);
        }
    },

    clearSignature() {
        const canvas = document.getElementById('signatureCanvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            document.getElementById('signatureBase64').value = '';
            this.invoice.signature = '';
            // Update aria-label for accessibility
            canvas.setAttribute('aria-label', 'Signature drawing area. No signature drawn.');
            const statusEl = document.getElementById('signatureStatus');
            if (statusEl) statusEl.textContent = 'Signature cleared';
            if (!this._suppressPreview) this.updatePreview();
        }
    },

    cleanupSignaturePad() {
        if (this._signatureObserver) {
            this._signatureObserver.disconnect();
            this._signatureObserver = null;
        }
        const canvas = document.getElementById('signatureCanvas');
        if (canvas && this._signatureHandlers) {
            canvas.removeEventListener('mousedown', this._signatureHandlers.startDraw);
            canvas.removeEventListener('mousemove', this._signatureHandlers.draw);
            canvas.removeEventListener('mouseup', this._signatureHandlers.endDraw);
            canvas.removeEventListener('mouseleave', this._signatureHandlers.endDraw);
            canvas.removeEventListener('touchstart', this._signatureHandlers.startDraw);
            canvas.removeEventListener('touchmove', this._signatureHandlers.draw);
            canvas.removeEventListener('touchend', this._signatureHandlers.endDraw);
            this._signatureHandlers = null;
        }
    },

    printInvoice() {
        if (!this.validateForm(false)) {
            this.showNotification('Please fill in all required fields correctly', 'error');
            return;
        }
        window.print();
    },

    async downloadImage() {
        try {
            this.updateInvoiceFromForm();
            if (!this.validateForm(false)) {
                this.showNotification('Please fill in all required fields correctly', 'error');
                return;
            }

            const element = document.getElementById('invoicePreview');
            if (!element || !element.innerHTML.trim()) {
                this.showNotification('Please add content before generating Image', 'error');
                return;
            }

            const originalStyle = {
                display: element.style.display,
                position: element.style.position,
                width: element.style.width
            };
            element.style.display = 'block';
            element.style.position = 'static';
            element.style.width = '100%';

            if (!this.user || this.user.tier === 'free') {
                await this.showInterstitialAd();
            }

            this.showNotification('Generating Image...', 'info');

            const watermarkEl = element.querySelector('#invoiceWatermark');
            const isFree = !this.user || this.user.tier === 'free';

            try {
                if (watermarkEl && isFree) {
                    watermarkEl.style.display = 'block';
                }
                const h2c = typeof html2canvas !== 'undefined'
                    ? html2canvas
                    : await import('./html2canvas.min.js').then(() => window.html2canvas);

                const canvas = await h2c(element, { scale: 2, useCORS: true, allowTaint: false });
                const dataUrl = canvas.toDataURL('image/jpeg', 0.98);

                const link = document.createElement('a');
                link.download = `${this.invoice.invoiceNumber || 'invoice'}.jpg`;
                link.href = dataUrl;
                link.click();

                this.showNotification('Image downloaded successfully', 'success');
            } catch (err) {
                console.error('[ErrorBoundary] Image generation error:', err);
                this.showNotification('Failed to generate Image', 'error');
            } finally {
                Object.assign(element.style, originalStyle);
                if (watermarkEl && isFree) {
                    watermarkEl.style.display = 'none';
                }
            }
        } catch (e) {
            console.error('[ErrorBoundary] downloadImage failed:', e);
            this.showNotification('Failed to download image', 'error');
        }
    },

    exportJSON() {
        try {
            this.updateInvoiceFromForm();
            if (!this.validateForm(false)) {
                this.showNotification('Please fill in all required fields correctly', 'error');
                return;
            }
            const json = this.invoice.toJSON();
            const dataStr = JSON.stringify(json, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${this.invoice.invoiceNumber || 'invoice'}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            this.showNotification('JSON exported successfully', 'success');
        } catch (e) {
            console.error('[ErrorBoundary] exportJSON failed:', e);
            this.showNotification('Failed to export JSON', 'error');
        }
    },

    handleImportFile(event) {
        try {
            const file = event.target.files[0];
            if (!file) return;
            this.storage.importInvoices(file).then(message => {
                try {
                    this.showNotification(message, 'success');
                    this.renderHistoryList();
                    this.updateAnalyticsDashboard();
                    document.getElementById('invoiceNumber').value = this.storage.peekNextInvoiceNumber();
                } catch (e) {
                    console.error('[ErrorBoundary] handleImportFile then failed:', e);
                    this.showNotification('Import succeeded but UI update failed', 'error');
                }
            }).catch(error => {
                this.showNotification(error || 'Import failed', 'error');
            });
            event.target.value = '';
        } catch (e) {
            console.error('[ErrorBoundary] handleImportFile failed:', e);
            this.showNotification('Import failed', 'error');
        }
    },

    exportAllInvoices() {
        const allInvoices = this.token ? this.apiInvoices : this.storage.getInvoices();
        if (!allInvoices || allInvoices.length === 0) {
            this.showNotification('No invoices to export', 'error');
            return;
        }

        // Export CSV
        const csvStr = convertToCSV(allInvoices);
        const csvBlob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
        const csvUrl = URL.createObjectURL(csvBlob);
        const csvLink = document.createElement('a');
        csvLink.href = csvUrl;
        csvLink.setAttribute('download', `invoices-export-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(csvLink);
        csvLink.click();
        document.body.removeChild(csvLink);

        // Also Export JSON for backup/migration
        const jsonStr = JSON.stringify(allInvoices, null, 2);
        const jsonBlob = new Blob([jsonStr], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const jsonLink = document.createElement('a');
        jsonLink.href = jsonUrl;
        jsonLink.setAttribute('download', `invoices-backup-${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(jsonLink);
        jsonLink.click();
        document.body.removeChild(jsonLink);

        this.showNotification('Invoices exported successfully (CSV & JSON)', 'success');
    },

    autoSaveDraft() {
        try {
            // Skip if a manual save is in progress
            if (this._saving) {
                console.log('[autoSaveDraft] Skipped - manual save in progress');
                return;
            }
            this.updateInvoiceFromForm();
            if (!this.invoice.id) this.invoice.id = generateId();
            const json = this.invoice.toJSON();
            const success = this.storage.saveInvoice(json);
            if (success) {
                this.showAutoSaveIndicator();
            }
        } catch (e) {
            console.error('[ErrorBoundary] autoSaveDraft failed:', e);
        }
    },

    highlightNecessaryFields() {
        const formSection = document.querySelector('.form-section');
        const requiredInputs = formSection ? formSection.querySelectorAll('input[required]') : [];
        if (requiredInputs.length === 0) return;

        requiredInputs.forEach(input => {
            input.classList.add('highlight-pulse');
            setTimeout(() => {
                input.classList.remove('highlight-pulse');
            }, 2000); // 2 second flash
        });

        // Find the first required empty input and focus it, otherwise just focus the first required input
        const firstEmpty = Array.from(requiredInputs).find(input => !input.value.trim());
        if (firstEmpty) {
            firstEmpty.focus();
        } else {
            requiredInputs[0].focus();
        }

        this.showNotification('Highlighted required details', 'info');
    },

    toggleMobileMenu() {
        const headerActions = document.getElementById('headerActions');
        const btn = document.getElementById('mobileMenuBtn');
        if (headerActions && btn) {
            headerActions.classList.toggle('mobile-open');
            const isOpen = headerActions.classList.contains('mobile-open');
            btn.setAttribute('aria-expanded', isOpen);
        }
    },

    async loadInvoiceHistory() {
        await this.renderHistoryList();
    },

    initLocaleSwitcher() {
        const wrapper = document.getElementById('localeSwitcher');
        if (wrapper) {
            wrapper.appendChild(i18n.createLocaleSwitcher());
        }
        i18n.translateDOM();
    },

    translateUI() {
        i18n.translateDOM();
        this.updateAuthUI();
        this.renderDashboard();
        this.updateAnalyticsDashboard();
        if (typeof Chart !== 'undefined') {
            this.renderCharts(this.token ? this.apiInvoices : this.storage.getInvoices());
        }
    },

    setupWebSocketListeners() {
        if (this._wsListenersSetup) return;
        this._wsListenersSetup = true;
        onEvent('invoice:created', () => {
            if (this.token) this.apiGetInvoices().then(() => {
                this.renderHistoryList();
                this.updateAnalyticsDashboard();
            });
        });
        onEvent('invoice:updated', () => {
            if (this.token) this.apiGetInvoices().then(() => {
                this.renderHistoryList();
                this.updateAnalyticsDashboard();
            });
        });
        onEvent('invoice:deleted', () => {
            if (this.token) this.apiGetInvoices().then(() => {
                this.renderHistoryList();
                this.updateAnalyticsDashboard();
            });
        });
        onEvent('invoice:status', () => {
            if (this.token) this.apiGetInvoices().then(() => {
                this.renderHistoryList();
                this.updateAnalyticsDashboard();
            });
        });
    }
};

// --- Assign module functions to app object ---

// Auth module
app.initAuth = initAuth;
app.updateAuthUI = updateAuthUI;
app.showAuthModal = showAuthModal;
app.switchAuthTab = switchAuthTab;
app.handleLogin = handleLogin;
app.handleRegister = handleRegister;
app.closeAuthUI = closeAuthUI;
app.logout = logout;
app.refreshUser = refreshUser;
app.openPortal = openPortal;
app.importLocalOnLogin = importLocalOnLogin;
app.showForgotPassword = showForgotPassword;
app.showForgotPasswordBack = showForgotPasswordBack;
app.handleForgotPassword = handleForgotPassword;
app.showResetPassword = showResetPassword;
app.handleResetPassword = handleResetPassword;
app.initResetPassword = initResetPassword;
app.deleteAccount = deleteAccount;

// API module
app.apiRequest = apiRequest;
app.apiGetInvoices = apiGetInvoices;
import { apiGetCompanyTemplates, apiSaveCompanyTemplate, apiDeleteCompanyTemplate } from './modules/api.js';
app.apiGetCompanyTemplates = apiGetCompanyTemplates;
app.apiSaveCompanyTemplate = apiSaveCompanyTemplate;
app.apiDeleteCompanyTemplate = apiDeleteCompanyTemplate;

// Company Templates Logic
import { initTemplatesPage, renderTemplateList, searchTemplates, openTemplateModal, closeTemplateModal, saveTemplateHandler, deleteTemplateHandler } from './modules/templates.js';

app.initTemplatesPage = initTemplatesPage;
app.renderTemplateList = renderTemplateList;
app.searchTemplates = searchTemplates;
app.openTemplateModal = openTemplateModal;
app.closeTemplateModal = closeTemplateModal;
app.saveTemplateHandler = saveTemplateHandler;
app.deleteTemplateHandler = deleteTemplateHandler;

app.loadCompanyTemplates = async function() {
    let templates = [];
    if (this.token && this.user) {
        templates = await this.apiGetCompanyTemplates() || [];
    } else {
        templates = this.storage.getCompanyTemplates();
    }

    const selectInfo = document.getElementById('companyTemplateSelect');
    if (!selectInfo) return;

    // Save current selection to restore if possible
    const currentVal = selectInfo.value;

    // Reset options
    selectInfo.innerHTML = '<option value="">-- Manual Entry --</option>';

    templates.forEach(t => {
        const option = document.createElement('option');
        option.value = t.id;
        option.textContent = t.name;
        // Attach data string for frontend extraction
        option.dataset.template = JSON.stringify({ ...t.data, id: t.id });
        selectInfo.appendChild(option);
    });

    // Try to restore previous selection
    if (currentVal && Array.from(selectInfo.options).some(o => o.value === currentVal)) {
        selectInfo.value = currentVal;
    }

    // Sync the custom select UI if applicable
    if (typeof this.syncCustomSelects === 'function') {
        this.syncCustomSelects();
    }
};

app.loadCompanyTemplate = function() {
    const selectInfo = document.getElementById('companyTemplateSelect');
    if (!selectInfo || !selectInfo.value) {
         // Handle "Manual entry" - do not clear, just let them edit
         return;
    }

    try {
         const selectedOption = selectInfo.options[selectInfo.selectedIndex];
         const data = JSON.parse(selectedOption.dataset.template);

         document.getElementById('companyName').value = data.companyName || '';
         document.getElementById('companyEmail').value = data.companyEmail || '';
         document.getElementById('companyPhone').value = data.companyPhone || '';
         document.getElementById('companyAddress').value = data.companyAddress || '';

         if (data.companyLogo) {
             document.getElementById('companyLogoBase64').value = data.companyLogo;
             const fileUploadText = document.querySelector('.file-upload-text');
             if (fileUploadText) fileUploadText.textContent = 'Template Logo Loaded';
         }

         if (data.theme) {
             const swatch = document.querySelector(`.theme-swatch[data-theme="${data.theme}"]`);
             if (swatch) this.selectThemeSwatch(swatch);
         }

         if (!this._suppressPreview && typeof this.updatePreview === 'function') {
             this.updatePreview();
         }
         if (typeof this.showNotification === 'function') {
            this.showNotification('Company Profile Loaded', 'success');
         }
    } catch (e) {
         console.error('Failed to load company template:', e);
         if (typeof this.showNotification === 'function') {
            this.showNotification('Error loading template', 'error');
         }
    }
};

app.apiSaveInvoice = apiSaveInvoice;
app.apiDeleteInvoice = apiDeleteInvoice;
app.apiImportInvoices = apiImportInvoices;
app.apiGetClients = apiGetClients;
app.apiSaveClient = apiSaveClient;
app.apiDeleteClient = apiDeleteClient;
app.apiImportClients = apiImportClients;
app.apiSendInvoice = apiSendInvoice;
app.apiDuplicateInvoice = apiDuplicateInvoice;
app.apiConvertToInvoice = apiConvertToInvoice;
app.apiUpdateInvoiceStatus = apiUpdateInvoiceStatus;
app.apiGetEmailConfig = apiGetEmailConfig;
app.apiSaveEmailConfig = apiSaveEmailConfig;
app.apiDeleteEmailConfig = apiDeleteEmailConfig;

// Invoice UI module
app.addItem = addItem;
app.removeItem = removeItem;
app.updateItemFromRow = updateItemFromRow;
app.updateItemAmount = updateItemAmount;
app.loadInvoice = loadInvoice;
app.loadLastDraft = loadLastDraft;
app.saveDraft = saveDraft;
app.saveInvoice = saveInvoice;
app.resetForm = resetForm;
app.updatePreview = safeWrap(updatePreview, app, 'updatePreview');
app.updateTotals = updateTotals;
app.updateInvoiceFromForm = updateInvoiceFromForm;
app.updateRecurringPreview = updateRecurringPreview;

// History module
app.showInvoiceHistory = showInvoiceHistory;
app.closeModal = closeModal;
app.renderHistoryList = safeWrap(renderHistoryList, app, 'renderHistoryList');
app.renderHistoryItem = renderHistoryItem;
app.updateAnalyticsDashboard = safeWrap(updateAnalyticsDashboard, app, 'updateAnalyticsDashboard');
app.searchHistory = safeWrap(searchHistory, app, 'searchHistory');
app.filterHistory = safeWrap(filterHistory, app, 'filterHistory');
app.loadInvoiceById = loadInvoiceById;
app.deleteInvoiceFromHistory = deleteInvoiceFromHistory;
app.clearAllData = clearAllData;
app.togglePaymentStatus = togglePaymentStatus;
app.generateNextInvoice = generateNextInvoice;
app.convertToInvoice = convertToInvoice;
app.generatePayLink = generatePayLink;
app.renderCharts = renderCharts;
app.toggleAllInvoices = toggleAllInvoices;
app.updateInvoiceStatus = updateInvoiceStatus;
app.showEmailConfigModal = showEmailConfigModal;
app.duplicateInvoice = duplicateInvoice;
app.sendInvoiceToClient = sendInvoiceToClient;
app.filterByDateRange = safeWrap(filterByDateRange, app, 'filterByDateRange');
app.getDateFilteredInvoices = getDateFilteredInvoices;
app.renderMonthlyHeatmap = renderMonthlyHeatmap;

// Clients module
app.saveClient = saveClient;
app.loadClient = loadClient;
app.showClientManager = showClientManager;
app.closeClientModal = closeClientModal;
app.renderClientDropdown = safeWrap(renderClientDropdown, app, 'renderClientDropdown');
app.renderClientList = safeWrap(renderClientList, app, 'renderClientList');
app.searchClients = searchClients;
app.loadClientById = loadClientById;
app.deleteClientById = deleteClientById;
app.addClient = addClient;

// Products module
app.showProductCatalog = safeWrap(showProductCatalog, app, 'showProductCatalog');
app.closeProductCatalog = closeProductCatalog;
app.renderProductCatalog = safeWrap(renderProductCatalog, app, 'renderProductCatalog');
app.renderSavedProductsDropdown = safeWrap(renderSavedProductsDropdown, app, 'renderSavedProductsDropdown');
app.addProductToInvoice = addProductToInvoice;
app.saveCurrentItemToCatalog = saveCurrentItemToCatalog;
app.deleteProductById = deleteProductById;
app.addProductFromSaved = addProductFromSaved;

// UI module
app.showConfirm = showConfirm;
app.showNotification = showNotification;
app.showAutoSaveIndicator = showAutoSaveIndicator;
app.setupAutoSave = setupAutoSave;
app.setupModalKeyboardHandling = setupModalKeyboardHandling;
app.setupEventListeners = setupEventListeners;
app.setupScrollListener = setupScrollListener;
app.initCustomSelects = initCustomSelects;
app.syncCustomSelects = syncCustomSelects;
app.selectThemeSwatch = selectThemeSwatch;
app.applyTheme = applyTheme;
app.setThemeMode = setThemeMode;
app.toggleTheme = function() {
    var currentTheme = document.documentElement.getAttribute('data-theme');
    var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setThemeMode(newTheme);
};
app.loadThemePreference = loadThemePreference;
app.showDashboardView = showDashboardView;
app.switchView = switchView;
app.showInvoiceView = showInvoiceView;
app.handleNewInvoice = function () {
    showInvoiceView();
    // Reset form for a new invoice
    this._suppressPreview = true;
    try {
        document.getElementById('clientName').value = '';
        document.getElementById('clientEmail').value = '';
        document.getElementById('clientPhone').value = '';
        document.getElementById('clientAddress').value = '';
        document.getElementById('invoiceNumber').value = this.storage.peekNextInvoiceNumber();
        document.getElementById('invoiceDate').value = '';
        document.getElementById('dueDate').value = '';
        document.getElementById('notes').value = '';
        document.getElementById('documentType').value = 'Invoice';
        document.getElementById('paymentLink').value = '';
        document.getElementById('recurringType').value = 'none';
        document.getElementById('taxType').value = 'none';
        document.getElementById('taxRate').value = 0;
        document.getElementById('discountType').value = 'none';
        document.getElementById('discountValue').value = 0;
        this.invoice = new Invoice();
        this.clearSignature();
        document.getElementById('itemsTableBody').innerHTML = '';
        this.addItem();
        this.setTodayDates();
        this.updateTaxDisplay();
        this.updateDiscountDisplay();
        this.syncCustomSelects();
    } finally {
        this._suppressPreview = false;
    }
    this.updatePreview();
};
app.hideAllViews = hideAllViews;
app.setActiveNav = setActiveNav;
app.updateHeader = updateHeader;

// Typewriter module
app.showTypewriter = showTypewriter;
app.Typewriter = Typewriter;

// Migration module
app.showMigrationPrompt = showMigrationPrompt;
app.dismissMigration = dismissMigration;
app.shouldShowMigration = shouldShowMigration;
app.hasLocalInvoices = hasLocalInvoices;
app.showInterstitialAd = showInterstitialAd;
app.skipInterstitial = skipInterstitial;
app.loadConfig = loadConfig;

// Settings module
app.showSettingsModal = showSettingsModal;

// WebSocket
app.connectWebSocket = connectWebSocket;
app.disconnectWebSocket = disconnectWebSocket;

// Dashboard
app.renderDashboard = safeWrap(renderDashboard, app, 'renderDashboard');
app.renderRevenueSmallChart = renderRevenueSmallChart;
app.renderStatusSmallChart = renderStatusSmallChart;
app.renderRevenueCostsChart = renderRevenueCostsChart;
app.renderTopClients = renderTopClients;
app.renderPerClientIncomeChart = renderPerClientIncomeChart;
app.renderKeyInsightsChart = renderKeyInsightsChart;
app.renderProjectedEarningsChart = renderProjectedEarningsChart;
app.renderARAgingChart = renderARAgingChart;
// Replace the shallow copy with a proxy so that window.app always reflects app's state dynamically,
// or just replace window.app entirely. Let's redirect window.app to app entirely.
window.app = app;

// Use once: true to prevent duplicate listeners if module re-imported
const startApp = async () => {
    await app.init();
    if (window.location.hash === '#invoice') {
        app.showInvoiceView();
    } else {
        app.showDashboardView();
    }
};
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp, { once: true });
} else {
    startApp();
}

// Guard against duplicate hashchange listeners
if (!window._hashchangeHandler) {
    window._hashchangeHandler = () => {
        if (window.location.hash === '#invoice') {
            app.showInvoiceView();
        } else if (window.location.hash === '' || window.location.hash === '#') {
            app.showDashboardView();
        }
    };
    window.addEventListener('hashchange', window._hashchangeHandler);
}

app.updateBulkActions = function () {
    const checkboxes = document.querySelectorAll('.bulk-checkbox:checked');
    const count = checkboxes.length;
    const bulkActions = document.getElementById('bulkActions');
    const bulkCount = document.getElementById('bulkCount');
    if (bulkActions) bulkActions.style.display = count > 0 ? 'flex' : 'none';
    if (bulkCount) bulkCount.textContent = `${count} ${i18n.t('common.selected')}`;
};

app.getSelectedIds = function () {
    return Array.from(document.querySelectorAll('.bulk-checkbox:checked')).map(cb => cb.value);
};

app.bulkDelete = async function () {
    const ids = this.getSelectedIds();
    if (ids.length === 0) return;
    this.showConfirm(`Delete ${ids.length} invoices?`).then(async (confirmed) => {
        if (!confirmed) return;
        let success = 0;
        for (const id of ids) {
            if (this.token) {
                const ok = await this.apiDeleteInvoice(id);
                if (ok) success++;
            } else {
                const ok = this.storage.deleteInvoice(id);
                if (ok) success++;
            }
        }
        await this.renderHistoryList();
        await this.updateAnalyticsDashboard();
        this.showNotification(`Deleted ${success} of ${ids.length} invoices`, 'success');
    });
};

// Pagination state
app._historyPage = 1;
app._clientPage = 1;
app._pageSize = 20;

app.prevPage = function () {
    if (app._historyPage > 1) {
        app._historyPage--;
        app.renderHistoryList();
    }
};

app.nextPage = function () {
    const invoices = app.token ? app.apiInvoices : app.storage.getInvoices();
    const totalPages = Math.max(1, Math.ceil(invoices.length / (app._pageSize || 20)));
    if (app._historyPage < totalPages) {
        app._historyPage++;
        app.renderHistoryList();
    }
};

app.prevClientPage = function () {
    if (app._clientPage > 1) {
        app._clientPage--;
        app.renderClientList();
    }
};

app.nextClientPage = function () {
    const clients = app.token ? app.apiClients : app.storage.getClients();
    const totalPages = Math.max(1, Math.ceil(clients.length / (app._pageSize || 20)));
    if (app._clientPage < totalPages) {
        app._clientPage++;
        app.renderClientList();
    }
};

app.bulkExport = function () {
    const ids = this.getSelectedIds();
    if (ids.length === 0) return;
    let allInvoices = this.token ? this.apiInvoices : this.storage.getInvoices();
    const selected = allInvoices.filter(inv => ids.includes(String(inv.id)));

    // Export CSV
    const csvStr = convertToCSV(selected);
    const csvBlob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const csvUrl = URL.createObjectURL(csvBlob);
    const csvLink = document.createElement('a');
    csvLink.href = csvUrl;
    csvLink.setAttribute('download', `invoices-bulk-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(csvLink);
    csvLink.click();
    document.body.removeChild(csvLink);

    // Export JSON
    const dataStr = JSON.stringify(selected, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoices-bulk-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => { URL.revokeObjectURL(url); URL.revokeObjectURL(csvUrl); }, 1000);
    this.showNotification(`Exported ${selected.length} invoices (CSV & JSON)`, 'success');
};

app.downloadPDF = async function () {
    try {
        this.updateInvoiceFromForm();
        if (!this.validateForm(false)) {
            this.showNotification('Please fill in all required fields correctly', 'error');
            return;
        }
        this.showNotification('Generating PDF...', 'info');
        if (this.token) {
            const res = await fetch(`${API_BASE}/api/invoices/pdf`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ data: this.invoice.toJSON(), id: this.invoice.id })
            });
            if (!res.ok) {
                let err;
                try {
                    err = await res.json();
                } catch {
                    err = { error: 'PDF generation failed' };
                }
                throw new Error(err.error || 'PDF generation failed');
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${this.invoice.invoiceNumber || 'invoice'}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            this.showNotification('PDF downloaded successfully', 'success');
        } else {
            window.print();
        }
    } catch (e) {
        console.error('PDF generation error:', e);
        this.showNotification(e.message || 'Failed to generate PDF', 'error');
        window.print();
    }
};

// Sidebar toggle functionality
app.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
};

app.closeSidebar = function() {
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById("sidebar");
        if (sidebar) sidebar.classList.remove("open");
    }
}
app.closeSidebar = function() {
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById("sidebar");
        if (sidebar && sidebar.classList.contains("open")) sidebar.classList.remove("open");
    }
};
