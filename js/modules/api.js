/**
 * API Communication Module
 * Handles all backend API requests for invoices and clients
 */
import { API_BASE } from '../config.js';

let _csrfToken = null;

async function ensureCsrfToken() {
    if (_csrfToken) return _csrfToken;
    const token = localStorage.getItem('invoice-auth-token');
    if (!token) return null;
    try {
        const res = await fetch(`${API_BASE}/api/auth/csrf-token`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            _csrfToken = data.csrfToken;
            return _csrfToken;
        }
    } catch {
        // Backend offline
    }
    return null;
}

function invalidateCsrfToken() {
    _csrfToken = null;
}

export async function apiRequest(path, options = {}) {
    const headers = { ...options.headers };
    if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
    }
    const method = (options.method || 'GET').toUpperCase();
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && this.token) {
        const csrf = await ensureCsrfToken();
        if (csrf) {
            headers['X-CSRF-Token'] = csrf;
        }
    }
    if (options.body && typeof options.body === 'object') {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
    }
    try {
        const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

        let data = null;
        if (res.status !== 204) {
            try {
                data = await res.json();
            } catch (err) {
                // If parsing fails for a non-204, it might be an issue.
                // We'll throw a more descriptive error.
                throw new Error('Failed to parse API response as JSON: ' + (err.message || 'Unknown error'));
            }
        }

        this._backendAvailable = true;
        if (res.status === 403 && (data && (data.error === 'Invalid CSRF token' || data.error === 'CSRF token expired'))) {
            invalidateCsrfToken();
            throw new Error(data.error + ' — please try again');
        }
        if (!res.ok) throw new Error((data && data.error) || 'Request failed');
        return data;
    } catch (err) {
        if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
            this._backendAvailable = false;
            throw new Error('Backend offline — working in local-only mode');
        }
        throw err;
    }
}

export async function apiGetInvoices() {
    if (!this.token) return this.storage.getInvoices();
    // If a fetch is already in flight, wait for it instead of returning stale data
    if (this._invoicesFetchPromise) return this._invoicesFetchPromise;
    this._invoicesFetchPromise = (async () => {
        const historyList = document.getElementById('historyList');
        if (historyList && historyList.querySelector('.history-item')) {
            historyList.innerHTML = '<div style="text-align:center;padding:2rem;"><span class="spinner" style="width:24px;height:24px;border-width:3px;"></span><p style="margin-top:0.75rem;color:var(--text-muted);">Loading invoices...</p></div>';
        }
        try {
            const data = await this.apiRequest('/api/invoices');
            this.apiInvoices = (data.invoices || []).map(inv => ({ ...inv, ...inv.data, id: inv.id, paid_at: inv.paid_at }));
            return this.apiInvoices;
        } catch (err) {
            // Don't return stale data on failure - throw error so UI can handle it
            this.apiInvoices = [];
            throw err;
        } finally {
            this._invoicesFetchPromise = null;
        }
    })();
    return this._invoicesFetchPromise;
}

export async function apiSaveInvoice(invoiceData) {
    if (!this.token) return this.storage.saveInvoice(invoiceData);
    try {
        // Fix 1 & 5: Use PUT for updates and pass custom_fields
        const isUpdate = !!invoiceData.id;
        const path = isUpdate ? `/api/invoices/${invoiceData.id}` : '/api/invoices';
        const method = isUpdate ? 'PUT' : 'POST';
        const data = await this.apiRequest(path, {
            method: method,
            body: { data: invoiceData, custom_fields: invoiceData.customFields || [] }
        });
        if (isUpdate) {
            const index = this.apiInvoices.findIndex(inv => inv.id === invoiceData.id);
            if (index > -1) {
                this.apiInvoices[index] = { ...invoiceData };
            }
        } else {
            this.apiInvoices.unshift({ ...invoiceData, id: data.id });
        }
        await this.refreshUser();
        return true;
    } catch (err) {
        if (this._backendAvailable === false) {
            return this.storage.saveInvoice(invoiceData);
        }
        throw err;
    }
}

export async function apiDeleteInvoice(id) {
    if (!this.token) return this.storage.deleteInvoice(id);
    try {
        await this.apiRequest(`/api/invoices/${id}`, { method: 'DELETE' });
        this.apiInvoices = this.apiInvoices.filter(inv => inv.id !== id);
        await this.refreshUser();
        return true;
    } catch {
        return false;
    }
}

export async function apiImportInvoices(invoices) {
    if (!this.token) return;
    try {
        const data = await this.apiRequest('/api/invoices/import', {
            method: 'POST',
            body: { invoices }
        });
        await this.apiGetInvoices();
        return data;
    } catch {
        return null;
    }
}

export async function apiGetClients() {
    if (!this.token) return this.storage.getClients();
    try {
        const data = await this.apiRequest('/api/clients');
        this.apiClients = data.clients || [];
        return this.apiClients;
    } catch {
        return this.apiClients;
    }
}

export async function apiSaveClient(clientData) {
    if (!this.token) return this.storage.saveClient(clientData);
    try {
        await this.apiRequest('/api/clients', {
            method: 'POST',
            body: clientData
        });
        return true;
    } catch (err) {
        if (this._backendAvailable === false) {
            return this.storage.saveClient(clientData);
        }
        throw err;
    }
}

export async function apiDeleteClient(id) {
    if (!this.token) return this.storage.deleteClient(id);
    try {
        await this.apiRequest(`/api/clients/${id}`, { method: 'DELETE' });
        this.apiClients = this.apiClients.filter(c => c.id !== id);
        return true;
    } catch {
        return false;
    }
}

export async function apiImportClients(clients) {
    if (!this.token) return;
    try {
        const data = await this.apiRequest('/api/clients/import', {
            method: 'POST',
            body: { clients }
        });
        await this.apiGetClients();
        return data;
    } catch {
        return null;
    }
}

// --- Product / service catalog ---

export async function apiGetProducts() {
    if (!this.token) return this.storage.getProducts ? this.storage.getProducts() : [];
    try {
        const data = await this.apiRequest('/api/products');
        this.apiProducts = data.products || [];
        return this.apiProducts;
    } catch {
        return this.apiProducts || [];
    }
}

export async function apiSaveProduct(productData) {
    if (!this.token) return this.storage.saveProduct ? this.storage.saveProduct(productData) : false;
    try {
        await this.apiRequest('/api/products', {
            method: 'POST',
            body: productData
        });
        return true;
    } catch (err) {
        if (this._backendAvailable === false && this.storage.saveProduct) {
            return this.storage.saveProduct(productData);
        }
        throw err;
    }
}

export async function apiDeleteProduct(id) {
    if (!this.token) return this.storage.deleteProduct ? this.storage.deleteProduct(id) : false;
    try {
        await this.apiRequest(`/api/products/${id}`, { method: 'DELETE' });
        this.apiProducts = (this.apiProducts || []).filter(p => p.id !== id);
        return true;
    } catch {
        return false;
    }
}

// --- New Phase 4 API Methods ---

export async function apiSendInvoice(id) {
    if (!this.token) return false;
    try {
        const data = await this.apiRequest(`/api/invoices/${id}/send`, {
            method: 'POST'
        });
        return data;
    } catch (err) {
        throw err;
    }
}

export async function apiDuplicateInvoice(id) {
    if (!this.token) {
        // Local mode - handled by storage
        return this.storage.duplicateInvoice(id);
    }
    try {
        const data = await this.apiRequest(`/api/invoices/${id}/duplicate`, {
            method: 'POST'
        });
        this.apiInvoices.unshift({ ...data.data, id: data.id });
        return data;
    } catch (err) {
        throw err;
    }
}

export async function apiUpdateInvoiceStatus(id, status) {
    if (!this.token) return false;
    try {
        const data = await this.apiRequest(`/api/invoices/${id}/status`, {
            method: 'PUT',
            body: { status }
        });
        return data;
    } catch (err) {
        throw err;
    }
}

export async function apiGetEmailConfig() {
    if (!this.token) return null;
    try {
        const data = await this.apiRequest('/api/email');
        return data.config;
    } catch {
        return null;
    }
}

export async function apiSaveEmailConfig(config) {
    if (!this.token) return false;
    try {
        await this.apiRequest('/api/email', {
            method: 'POST',
            body: config
        });
        return true;
    } catch (err) {
        throw err;
    }
}

export async function apiDeleteEmailConfig() {
    if (!this.token) return false;
    try {
        await this.apiRequest('/api/email', {
            method: 'DELETE'
        });
        return true;
    } catch {
        return false;
    }
}

export async function apiConvertToInvoice(id) {
    if (!this.token) return false;
    try {
        const data = await this.apiRequest(`/api/invoices/${id}/convert`, {
            method: 'POST'
        });
        return data;
    } catch (err) {
        throw err;
    }
}

export async function apiGetPaymentLink(id) {
    if (!this.token) return null;
    try {
        const data = await this.apiRequest(`/api/invoices/${id}/payment-link`, {
            method: 'POST'
        });
        return data;
    } catch (err) {
        throw err;
    }
}

export async function apiGetCompanyTemplates() {
    if (!this.token) return null;
    try {
        return await this.apiRequest('/api/templates');
    } catch (err) {
        return null;
    }
}

export async function apiSaveCompanyTemplate(payload) {
    if (!this.token) return false;
    try {
        return await this.apiRequest('/api/templates', {
            method: 'POST',
            body: payload
        });
    } catch (err) {
        throw err;
    }
}

export async function apiDeleteCompanyTemplate(id) {
    if (!this.token) return false;
    try {
        await this.apiRequest(`/api/templates/${id}`, {
            method: 'DELETE'
        });
        return true;
    } catch (err) {
        return false;
    }
}
