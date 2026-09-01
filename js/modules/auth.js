/**
 * Authentication Module
 * Handles user sign in, sign up, logout, and auth UI
 */
import { API_BASE } from '../config.js';

export async function initAuth() {
    if (!this.token) {
        this.updateAuthUI();
        if (this.shouldShowMigration()) this.showMigrationPrompt();
        return;
    }
    try {
        if (this.connectWebSocket) {
            this.connectWebSocket(this.token);
            this.setupWebSocketListeners();
        }
        const res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        if (!res.ok) {
            this.token = null;
            localStorage.removeItem('invoice-auth-token');
            this.updateAuthUI();
            if (this.shouldShowMigration()) this.showMigrationPrompt();
            return;
        }
        const data = await res.json();
        if (data) {
            this.user = data.user;
            this.updateAuthUI();
            await this.apiGetInvoices();
            await this.apiGetClients();
            this.renderClientDropdown();
            await this.renderHistoryList();
            await this.updateAnalyticsDashboard();
        }
    } catch {
        this._backendAvailable = false;
        this.token = null;
        localStorage.removeItem('invoice-auth-token');
        this.updateAuthUI();
        if (this.shouldShowMigration()) this.showMigrationPrompt();
    }
}

export function updateAuthUI() {
    const authSection = document.getElementById('authSection');
    const userSection = document.getElementById('userSection');
    const tierBadge = document.getElementById('tierBadge');
    const userEmail = document.getElementById('userEmail');
    const actionCount = document.getElementById('actionCount');
    const upgradeBtn = document.getElementById('upgradeBtn');
    const adHeader = document.getElementById('adHeader');
    const adSidebar = document.getElementById('adSidebar');
    const adFooter = document.getElementById('adFooter');

    if (this._backendAvailable === false && !this.user) {
        if (authSection) authSection.style.display = 'none';
        if (userSection) userSection.style.display = 'none';
        if (upgradeBtn) upgradeBtn.style.display = 'none';
        return;
    }

    const isPaid = this.user && (this.user.tier === 'startup' || this.user.tier === 'business');
    [adHeader, adSidebar, adFooter].forEach(el => {
        if (el) el.classList.toggle('ad-hidden', isPaid);
    });

    if (this.user) {
        if (authSection) authSection.style.display = 'none';
        if (userSection) userSection.style.display = 'flex';
        if (userEmail) userEmail.textContent = this.user.email;
        if (tierBadge) {
            tierBadge.textContent = this.user.tier.toUpperCase();
            tierBadge.className = 'tier-badge' + (this.user.tier === 'startup' ? ' startup' : this.user.tier === 'business' ? ' business' : '');
        }
        if (actionCount) {
            actionCount.textContent = this.user.actionLimit !== null
                ? `${this.user.actionCount}/${this.user.actionLimit} today`
                : 'Unlimited';
        }

        if (upgradeBtn) {
            if (this.user.tier === 'business') {
                upgradeBtn.textContent = '💎 Manage Subscription';
                upgradeBtn.onclick = () => app.openPortal();
            } else if (this.user.tier === 'startup') {
                upgradeBtn.textContent = '💎 Upgrade to Business';
                upgradeBtn.onclick = () => window.location.href = 'pricing.html';
            } else {
                upgradeBtn.textContent = '💎 Upgrade to Startup';
                upgradeBtn.onclick = () => window.location.href = 'pricing.html';
            }
        }
    } else {
        if (authSection) authSection.style.display = '';
        if (userSection) userSection.style.display = 'none';
        if (upgradeBtn) {
            upgradeBtn.textContent = '💎 Upgrade to Pro';
            upgradeBtn.onclick = () => window.location.href = 'pricing.html';
        }
    }
}

export function showAuthModal() {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    // Reset to login tab when opening modal
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authTabs = document.getElementById('authTabs');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const authModalTitle = document.getElementById('authModalTitle');
    const loginError = document.getElementById('loginError');
    const registerError = document.getElementById('registerError');
    const forgotPasswordError = document.getElementById('forgotPasswordError');
    const forgotPasswordSuccess = document.getElementById('forgotPasswordSuccess');
    const resetPasswordError = document.getElementById('resetPasswordError');
    const resetPasswordSuccess = document.getElementById('resetPasswordSuccess');
    const forgotEmail = document.getElementById('forgotEmail');
    const resetPasswordToken = document.getElementById('resetPasswordToken');
    const resetPassword = document.getElementById('resetPassword');
    
    if (loginForm) loginForm.style.display = '';
    if (registerForm) registerForm.style.display = 'none';
    if (authTabs) authTabs.style.display = '';
    if (forgotPasswordForm) forgotPasswordForm.style.display = 'none';
    if (resetPasswordForm) resetPasswordForm.style.display = 'none';
    if (authModalTitle) authModalTitle.textContent = 'Sign In';
    if (loginError) loginError.textContent = '';
    if (registerError) registerError.textContent = '';
    if (forgotPasswordError) forgotPasswordError.textContent = '';
    if (forgotPasswordSuccess) forgotPasswordSuccess.textContent = '';
    if (resetPasswordError) resetPasswordError.textContent = '';
    if (resetPasswordSuccess) resetPasswordSuccess.textContent = '';
    
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (window._focusModal) window._focusModal(modal);
}

export function showForgotPassword() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authTabs = document.getElementById('authTabs');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const authModalTitle = document.getElementById('authModalTitle');
    const forgotPasswordError = document.getElementById('forgotPasswordError');
    const forgotPasswordSuccess = document.getElementById('forgotPasswordSuccess');
    const forgotEmail = document.getElementById('forgotEmail');
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'none';
    if (authTabs) authTabs.style.display = 'none';
    if (forgotPasswordForm) forgotPasswordForm.style.display = '';
    if (authModalTitle) authModalTitle.textContent = 'Reset Password';
    if (forgotPasswordError) forgotPasswordError.textContent = '';
    if (forgotPasswordSuccess) forgotPasswordSuccess.textContent = '';
    if (forgotEmail) forgotEmail.focus();
}

export function showForgotPasswordBack() {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const authTabs = document.getElementById('authTabs');
    const loginForm = document.getElementById('loginForm');
    const authModalTitle = document.getElementById('authModalTitle');
    if (forgotPasswordForm) forgotPasswordForm.style.display = 'none';
    if (resetPasswordForm) resetPasswordForm.style.display = 'none';
    if (authTabs) authTabs.style.display = '';
    if (loginForm) loginForm.style.display = '';
    if (authModalTitle) authModalTitle.textContent = 'Sign In';
}

export function showResetPassword(token) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authTabs = document.getElementById('authTabs');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const resetPasswordToken = document.getElementById('resetPasswordToken');
    const authModalTitle = document.getElementById('authModalTitle');
    const resetPasswordError = document.getElementById('resetPasswordError');
    const resetPasswordSuccess = document.getElementById('resetPasswordSuccess');
    const resetPassword = document.getElementById('resetPassword');
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'none';
    if (authTabs) authTabs.style.display = 'none';
    if (forgotPasswordForm) forgotPasswordForm.style.display = 'none';
    if (resetPasswordForm) resetPasswordForm.style.display = '';
    if (resetPasswordToken) resetPasswordToken.value = token || '';
    if (authModalTitle) authModalTitle.textContent = 'Reset Password';
    if (resetPasswordError) resetPasswordError.textContent = '';
    if (resetPasswordSuccess) resetPasswordSuccess.textContent = '';
    if (resetPassword) resetPassword.focus();
}

export async function handleResetPassword(e) {
    e.preventDefault();
    const tokenEl = document.getElementById('resetPasswordToken');
    const token = tokenEl ? tokenEl.value.trim() : '';
    const passwordEl = document.getElementById('resetPassword');
    const confirmEl = document.getElementById('resetPasswordConfirm');
    const password = passwordEl ? passwordEl.value : '';
    const confirm = confirmEl ? confirmEl.value : '';
    const errorEl = document.getElementById('resetPasswordError');
    const successEl = document.getElementById('resetPasswordSuccess');
    const btn = e.target.querySelector('button[type="submit"]');
    if (errorEl) errorEl.textContent = '';
    if (successEl) successEl.textContent = '';

    if (!token) {
        if (errorEl) errorEl.textContent = 'Invalid or missing reset link. Please request a new one.';
        return;
    }
    if (password.length < 8) {
        if (errorEl) errorEl.textContent = 'Password must be at least 8 characters';
        return;
    }
    if (password !== confirm) {
        if (errorEl) errorEl.textContent = 'Passwords do not match';
        return;
    }

    if(!btn)return;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';
    btn.classList.add('btn-loading');

    try {
        await this.apiRequest('/api/auth/reset-password', {
            method: 'POST',
            body: { token, password }
        });
        btn.textContent = 'Done';
        if (successEl) successEl.textContent = 'Password updated successfully. You can now sign in.';
        // Return to the sign-in view within the open modal
        showForgotPasswordBack();
    } catch (err) {
        btn.disabled = false;
        btn.innerHTML = originalText;
        if (errorEl) errorEl.textContent = err.message || 'Reset failed, please try again';
    } finally {
        btn.classList.remove('btn-loading');
    }
}

export function initResetPassword() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset_token');
    if (!token) return;
    // Strip the token from the URL so it isn't stored in history or shared
    history.replaceState({}, '', window.location.pathname);
    showAuthModal();
    showResetPassword(token);
}

export async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value.trim();
    const errorEl = document.getElementById('forgotPasswordError');
    const successEl = document.getElementById('forgotPasswordSuccess');
    const btn = e.target.querySelector('button[type="submit"]');
    errorEl.textContent = '';
    successEl.textContent = '';

    if (!email) {
        errorEl.textContent = 'Please enter your email';
        return;
    }

    if(!btn)return;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';
    btn.classList.add('btn-loading');

    try {
        const data = await this.apiRequest('/api/auth/forgot-password', {
            method: 'POST',
            body: { email }
        });
        successEl.textContent = 'If the email exists, a reset link has been sent.';
        btn.textContent = 'Email Sent';
    } catch (err) {
        errorEl.textContent = err.message || 'Failed to send reset email';
        btn.disabled = false;
        btn.innerHTML = originalText;
    } finally {
        btn.classList.remove('btn-loading');
    }
}

export function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    const tabBtn = document.querySelector(`.auth-tab[data-tab="${tab}"]`);
    if (tabBtn) tabBtn.classList.add('active');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authTabs = document.getElementById('authTabs');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const authModalTitle = document.getElementById('authModalTitle');
    const loginError = document.getElementById('loginError');
    const registerError = document.getElementById('registerError');
    if (loginForm) loginForm.style.display = tab === 'login' ? '' : 'none';
    if (registerForm) registerForm.style.display = tab === 'register' ? '' : 'none';
    if (authTabs) authTabs.style.display = '';
    if (forgotPasswordForm) forgotPasswordForm.style.display = 'none';
    if (authModalTitle) authModalTitle.textContent = tab === 'login' ? 'Sign In' : 'Create Account';
    if (loginError) loginError.textContent = '';
    if (registerError) registerError.textContent = '';
}

export async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    const btn = e.target.querySelector('button[type="submit"]');
    errorEl.textContent = '';

    if(!btn)return;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';
    btn.classList.add('btn-loading');

    try {
        const data = await this.apiRequest('/api/auth/login', {
            method: 'POST',
            body: { email, password }
        });
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('invoice-auth-token', this.token);
        if (this.connectWebSocket) this.connectWebSocket(this.token);
        if (this.setupWebSocketListeners) this.setupWebSocketListeners();
        this.closeAuthUI();
        await this.importLocalOnLogin();
        await this.renderHistoryList();
        await this.updateAnalyticsDashboard();
        this.showNotification('Signed in successfully', 'success');
    } catch (err) {
        if (this._backendAvailable === false) {
            this.closeAuthUI();
            this.showNotification('Server is offline — running in local-only mode', 'info');
        } else {
            errorEl.textContent = err.message || 'Login failed';
        }
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
        btn.classList.remove('btn-loading');
    }
}

export async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerPasswordConfirm').value;
    const errorEl = document.getElementById('registerError');
    const btn = e.target.querySelector('button[type="submit"]');
    errorEl.textContent = '';

    if (password !== confirm) {
        errorEl.textContent = 'Passwords do not match';
        return;
    }

    if (password.length < 8) {
        errorEl.textContent = 'Password must be at least 8 characters';
        return;
    }

    if(!btn)return;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';
    btn.classList.add('btn-loading');

    try {
        const data = await this.apiRequest('/api/auth/register', {
            method: 'POST',
            body: { email, password }
        });
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('invoice-auth-token', this.token);
        if (this.connectWebSocket) this.connectWebSocket(this.token);
        if (this.setupWebSocketListeners) this.setupWebSocketListeners();
        this.closeAuthUI();
        await this.importLocalOnLogin();
        await this.renderHistoryList();
        await this.updateAnalyticsDashboard();
        this.showNotification('Account created successfully', 'success');
    } catch (err) {
        if (this._backendAvailable === false) {
            this.closeAuthUI();
            this.showNotification('Server is offline — running in local-only mode', 'info');
        } else {
            errorEl.textContent = err.message || 'Registration failed';
        }
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
        btn.classList.remove('btn-loading');
    }
}

export function closeAuthUI() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
    const loginError = document.getElementById('loginError');
    if (loginError) loginError.textContent = '';
    const registerError = document.getElementById('registerError');
    if (registerError) registerError.textContent = '';
    const forgotPasswordError = document.getElementById('forgotPasswordError');
    if (forgotPasswordError) forgotPasswordError.textContent = '';
    const forgotPasswordSuccess = document.getElementById('forgotPasswordSuccess');
    if (forgotPasswordSuccess) forgotPasswordSuccess.textContent = '';
    const resetPasswordError = document.getElementById('resetPasswordError');
    if (resetPasswordError) resetPasswordError.textContent = '';
    const resetPasswordSuccess = document.getElementById('resetPasswordSuccess');
    if (resetPasswordSuccess) resetPasswordSuccess.textContent = '';
    if (window._restoreFocus) window._restoreFocus();
    this.updateAuthUI();
}

export function logout() {
    // Revoke token on server before clearing local state
    if (this.token) {
        this.apiRequest('/api/auth/logout', { method: 'POST' }).catch(() => {});
    }
    this.token = null;
    this.user = null;
    this.apiInvoices = [];
    this.apiClients = [];
    this._localImportDone = false; // Reset import flag for next login
    localStorage.removeItem('invoice-auth-token');
    if (this.disconnectWebSocket) this.disconnectWebSocket();
    this.updateAuthUI();
    this.renderClientDropdown();
    this.showNotification('Signed out', 'success');
}

export async function refreshUser() {
    if (!this.token) return;
    try {
        const data = await this.apiRequest('/api/auth/me');
        this.user = data.user;
        this.updateAuthUI();
    } catch {}
}

export async function openPortal() {
    if (!this.token) return;
    try {
        const data = await this.apiRequest('/api/subscription/portal', {
            method: 'POST'
        });
        if (data.url) {
            window.location.href = data.url;
        }
    } catch (err) {
        this.showNotification(err.message || 'Failed to open billing portal', 'error');
    }
}

export async function importLocalOnLogin() {
    // Guard against multiple imports
    if (this._localImportDone) return;
    
    const localInvoices = this.storage.getInvoices();
    if (this.token && localInvoices.length > 0) {
        const data = await this.apiImportInvoices(localInvoices);
        if (data && data.imported > 0) {
            this.showNotification(`Imported ${data.imported} invoice(s) from local storage`, 'success');
            this.storage.clearAllInvoices();
        }
    }

    const localClients = this.storage.getClients();
    if (this.token && localClients.length > 0) {
        const data = await this.apiImportClients(localClients);
        if (data && data.imported > 0) {
            this.showNotification(`Imported ${data.imported} client(s) from local storage`, 'success');
            this.storage.clearAllClients();
        }
    }
    
    this._localImportDone = true;
}

export async function deleteAccount() {
    if (!this.token) return;
    const confirmed = await this.showConfirm('Are you sure you want to delete your account? This cannot be undone.');
    if (!confirmed) return;
    try {
        await this.apiRequest('/api/auth/account', { method: 'DELETE' });
        this.token = null;
        this.user = null;
        this.apiInvoices = [];
        this.apiClients = [];
        localStorage.removeItem('invoice-auth-token');
        if (this.disconnectWebSocket) this.disconnectWebSocket();
        this.updateAuthUI();
        this.renderClientDropdown();
        this.showNotification('Account deleted', 'success');
    } catch (err) {
        this.showNotification(err.message || 'Failed to delete account', 'error');
    }
}
