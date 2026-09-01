window.app = window.app || {};
/**
 * Main application logic - Refactored (Phase 3)
 * Composes all modules into the app object
 */
import { API_BASE } from './config.js';

// Error boundary utility
function safeWrap(fn, context, name) {
    return function (...args) {
        try {
            return fn.apply(context, args);
        } catch (e) {
            console.error(`[ErrorBoundary] ${name || fn.name || 'anonymous'} failed:`, e);
            if (context && typeof context.showNotification === 'function') {
                context.showNotification(`Something went wrong: ${e.message}`, 'error');
            }
        }
    };
}

// Import module functions
import { initAuth, updateAuthUI, showAuthModal, closeAuthModal, switchAuthTab, handleLogin, handleRegister, closeAuthUI, logout, refreshUser, openPortal, importLocalOnLogin, showForgotPassword, showForgotPasswordBack, handleForgotPassword, deleteAccount } from './modules/auth.js';
import { apiRequest, apiGetInvoices, apiSaveInvoice, apiDeleteInvoice, apiImportInvoices, apiGetClients, apiSaveClient, apiDeleteClient, apiImportClients, apiSendInvoice, apiDuplicateInvoice, apiUpdateInvoiceStatus, apiGetEmailConfig, apiSaveEmailConfig, apiDeleteEmailConfig } from './modules/api.js';
import { addItem, removeItem, updateItemFromRow, updateItemAmount, loadInvoice, loadLastDraft, saveDraft, resetForm, updatePreview, updateTotals, updateInvoiceFromForm } from './modules/invoice-ui.js';
import { showInvoiceHistory, closeModal, renderHistoryList, renderHistoryItem, updateHistoryDashboard, searchHistory, filterHistory, loadInvoiceById, deleteInvoiceFromHistory, clearAllData, togglePaymentStatus, generateNextInvoice, renderCharts, toggleAllInvoices, updateInvoiceStatus, showEmailConfigModal, duplicateInvoice, sendInvoiceToClient } from './modules/history.js';
import { saveClient, loadClient, showClientManager, closeClientModal, renderClientDropdown, renderClientList, searchClients, loadClientById, deleteClientById, addClient } from './modules/clients.js';
import { showConfirm, showNotification, showAutoSaveIndicator, setupAutoSave, setupModalKeyboardHandling, setupEventListeners, setupScrollListener, initCustomSelects, syncCustomSelects, selectThemeSwatch, applyTheme, setThemeMode, loadThemePreference, showDashboardView, showInvoiceView, hideAllViews, setActiveNav, updateHeader, switchView } from './modules/ui.js';
import { showMigrationPrompt, dismissMigration, shouldShowMigration, hasLocalInvoices, showInterstitialAd, skipInterstitial, loadConfig } from './modules/migration.js';
import { renderDashboard, renderRevenueSmallChart, renderStatusSmallChart, renderRevenueCostsChart, renderTopClients } from './modules/dashboard.js';
import { showSettingsModal } from './modules/settings.js';
import { connectWebSocket, disconnectWebSocket, onEvent } from './modules/websocket-client.js';
import { handleGoogleSignIn, handleGitHubSignIn } from './modules/oauth.js';
import Invoice from './invoice.js';
import InvoiceStorage from './storage.js';
import i18n from './i18n.js';
import { Typewriter, showTypewriter } from './typewriter.js';

const app = {
    invoice: null,
    storage: new InvoiceStorage(),
    user: null,
    token: localStorage.getItem('invoice-auth-token'),
    apiInvoices: [],
    apiClients: [],
    _migrationPromptShown: false,
    _backendAvailable: null,

    // --- Core Entry Point ---
    init() {
        const steps = [
            ['loadThemePreference', () => this.loadThemePreference()],
            ['createInvoice', () => { this.invoice = new Invoice(); }],
            ['setupEventListeners', () => this.setupEventListeners()],
            ['initializeForm', () => this.initializeForm()],
            ['renderClientDropdown', () => this.renderClientDropdown()],
            ['loadInvoiceHistory', () => this.loadInvoiceHistory()],
            ['setTodayDates', () => this.setTodayDates()],
            ['addFirstItem', () => { if (this.invoice.items.length === 0) this.addItem(); }],
            ['initSignaturePad', () => this.initSignaturePad()],
            ['initCustomSelects', () => this.initCustomSelects()],
            ['updateInvoiceFromForm', () => this.updateInvoiceFromForm()],
            ['setupModalKeyboardHandling', () => this.setupModalKeyboardHandling()],
            ['setupAutoSave', () => this.setupAutoSave()],
            ['initAuth', () => this.initAuth()],
            ['loadConfig', () => this.loadConfig()],
            ['setupScrollListener', () => this.setupScrollListener()],
            ['initLocaleSwitcher', () => this.initLocaleSwitcher()],
            ['renderDashboard', () => this.renderDashboard()]
        ];
        for (const [name, fn] of steps) {
            try {
                fn();
            } catch (e) {
                console.error(`[ErrorBoundary] init.${name} failed:`, e);
                this.showNotification(`Error during ${name}: ${e.message}`, 'error');
            }
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
        document.getElementById('invoiceNumber').value = this.storage.peekNextInvoiceNumber();

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

        if (invoiceDateEl && !invoiceDateEl.value) {
            const today = new Date();
            invoiceDateEl.value = today.toISOString().split('T')[0];
        }

        if (dueDateEl && !dueDateEl.value) {
            const today = new Date();
            const dueDate = new Date(today);
            dueDate.setDate(dueDate.getDate() + 30);
            dueDateEl.value = dueDate.toISOString().split('T')[0];
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
        const taxType = document.getElementById('taxType').value;
        const taxRateInput = document.getElementById('taxRate');
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
        const discountType = document.getElementById('discountType').value;
        const discountInput = document.getElementById('discountValue');
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
                    document.getElementById('companyLogoBase64').value = e.target.result;
                    this.invoice.companyLogo = e.target.result;
                    this.updatePreview();
                    this.showNotification('Logo uploaded', 'success');
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

            const resize = () => {
                try {
                    const rect = canvas.parentElement.getBoundingClientRect();
                    canvas.width = rect.width;
                    canvas.height = rect.height;
                } catch (e) {
                    console.error('[ErrorBoundary] signature resize failed:', e);
                }
            };
            resize();
            if (this._signatureResizeHandler) {
                window.removeEventListener('resize', this._signatureResizeHandler);
            }
            this._signatureResizeHandler = resize;
            window.addEventListener('resize', resize);

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
                    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-main').trim() || '#121212';
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
            if (!this._suppressPreview) this.updatePreview();
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

            try {
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
                    this.updateHistoryDashboard();
                    document.getElementById('invoiceNumber').value = this.storage.getNextInvoiceNumber();
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
        const success = this.storage.exportInvoices();
        if (success) {
            this.showNotification('Invoices exported successfully', 'success');
        } else {
            this.showNotification('No invoices to export', 'error');
        }
    },

    autoSaveDraft() {
        try {
            this.updateInvoiceFromForm();
            if (!this.invoice.id) this.invoice.id = crypto.randomUUID();
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
        this.updateHistoryDashboard();
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
                this.updateHistoryDashboard();
            });
        });
        onEvent('invoice:updated', () => {
            if (this.token) this.apiGetInvoices().then(() => {
                this.renderHistoryList();
                this.updateHistoryDashboard();
            });
        });
        onEvent('invoice:deleted', () => {
            if (this.token) this.apiGetInvoices().then(() => {
                this.renderHistoryList();
                this.updateHistoryDashboard();
            });
        });
        onEvent('invoice:status', () => {
            if (this.token) this.apiGetInvoices().then(() => {
                this.renderHistoryList();
                this.updateHistoryDashboard();
            });
        });
    }
};

// --- Assign module functions to app object ---

// Auth module
app.initAuth = initAuth;
app.updateAuthUI = updateAuthUI;
app.showAuthModal = showAuthModal;
app.closeAuthModal = closeAuthModal;
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
app.deleteAccount = deleteAccount;

// API module
app.apiRequest = apiRequest;
app.apiGetInvoices = apiGetInvoices;
app.apiSaveInvoice = apiSaveInvoice;
app.apiDeleteInvoice = apiDeleteInvoice;
app.apiImportInvoices = apiImportInvoices;
app.apiGetClients = apiGetClients;
app.apiSaveClient = apiSaveClient;
app.apiDeleteClient = apiDeleteClient;
app.apiImportClients = apiImportClients;
app.apiSendInvoice = apiSendInvoice;
app.apiDuplicateInvoice = apiDuplicateInvoice;
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
app.resetForm = resetForm;
app.updatePreview = updatePreview;
app.updateTotals = updateTotals;
app.updateInvoiceFromForm = updateInvoiceFromForm;

// History module
app.showInvoiceHistory = showInvoiceHistory;
app.closeModal = closeModal;
app.renderHistoryList = renderHistoryList;
app.renderHistoryItem = renderHistoryItem;
app.updateHistoryDashboard = updateHistoryDashboard;
app.searchHistory = searchHistory;
app.filterHistory = filterHistory;
app.loadInvoiceById = loadInvoiceById;
app.deleteInvoiceFromHistory = deleteInvoiceFromHistory;
app.clearAllData = clearAllData;
app.togglePaymentStatus = togglePaymentStatus;
app.generateNextInvoice = generateNextInvoice;
app.renderCharts = renderCharts;
app.toggleAllInvoices = toggleAllInvoices;
app.updateInvoiceStatus = updateInvoiceStatus;
app.showEmailConfigModal = showEmailConfigModal;
app.duplicateInvoice = duplicateInvoice;
app.sendInvoiceToClient = sendInvoiceToClient;

// Clients module
app.saveClient = saveClient;
app.loadClient = loadClient;
app.showClientManager = showClientManager;
app.closeClientModal = closeClientModal;
app.renderClientDropdown = renderClientDropdown;
app.renderClientList = renderClientList;
app.searchClients = searchClients;
app.loadClientById = loadClientById;
app.deleteClientById = deleteClientById;
app.addClient = addClient;

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

// OAuth
app.handleGoogleSignIn = handleGoogleSignIn;
app.handleGitHubSignIn = handleGitHubSignIn;

// Dashboard
app.renderDashboard = renderDashboard;
app.renderRevenueSmallChart = renderRevenueSmallChart;
app.renderStatusSmallChart = renderStatusSmallChart;
app.renderRevenueCostsChart = renderRevenueCostsChart;
app.renderTopClients = renderTopClients;
Object.assign(window.app || (window.app = {}), app);

document.addEventListener('DOMContentLoaded', () => {
    app.init();
    if (window.location.hash === '#invoice') {
        app.showInvoiceView();
    }
});

window.addEventListener('hashchange', () => {
    if (window.location.hash === '#invoice') {
        app.showInvoiceView();
    } else if (window.location.hash === '' || window.location.hash === '#') {
        app.showDashboardView();
    }
});

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
        await this.updateHistoryDashboard();
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
    const dataStr = JSON.stringify(selected, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoices-bulk-export.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.showNotification(`Exported ${selected.length} invoices`, 'success');
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
                body: JSON.stringify({ data: this.invoice.toJSON() })
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
