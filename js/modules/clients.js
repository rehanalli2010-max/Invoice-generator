/**
 * Client Management Module
 * Handles client CRUD operations and client manager UI
 */

import { escapeHtml } from '../utils.js';

export async function saveClient() {
    const name = document.getElementById('clientName').value.trim();
    const email = document.getElementById('clientEmail').value.trim();
    const phone = document.getElementById('clientPhone').value.trim();
    const address = document.getElementById('clientAddress').value.trim();
    if (!name) {
        this.showNotification('Client name is required to save', 'error');
        return;
    }
    const clientData = { name, email, phone, address };
    try {
        let success;
        if (this.token) {
            success = await this.apiSaveClient(clientData);
        } else {
            success = this.storage.saveClient(clientData);
        }
        if (success) {
            if (this.token) {
                await this.apiGetClients();
            }
            this.renderClientDropdown();
            this.showNotification('Client saved', 'success');
        } else {
            this.showNotification('Failed to save client', 'error');
        }
    } catch (err) {
        this.showNotification(err.message || 'Failed to save client', 'error');
    }
}

export function loadClient() {
    const select = document.getElementById('savedClients');
    const clientId = select.value;
    if (!clientId) return;
    const clients = this.token ? this.apiClients : this.storage.getClients();
    const client = clients.find(c => c.id === clientId);
    if (client) {
        document.getElementById('clientName').value = client.name || '';
        document.getElementById('clientEmail').value = client.email || '';
        document.getElementById('clientPhone').value = client.phone || '';
        document.getElementById('clientAddress').value = client.address || '';
        this.updateInvoiceFromForm();
    }
}

export function showClientManager() {
    if (this && typeof this.switchView === 'function') {
        this.switchView('clients');
    } else {
        this.hideAllViews();
        this.updateHeader('Manage Clients', 'Add, edit, and organize your client list');
        const clients = document.getElementById('clients');
        if (clients) {
            clients.style.display = 'block';
            clients.classList.add('active');
        }
    }

    document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
    const cLink = document.getElementById('navClients');
    if (cLink) cLink.classList.add('active');

    this.renderClientList();
}

export function closeClientModal() {
    // Client view is dedicated now, not a modal
}

export function renderClientDropdown() {
    const select = document.getElementById('savedClients');
    if (!select) return;
    const clients = this.token ? this.apiClients : this.storage.getClients();
    const t = (k) => typeof i18n !== 'undefined' ? i18n.t(k) : k;
    select.innerHTML = `<option value="">${t('invoiceForm.selectClient')}</option>`;
    clients.forEach(client => {
        const opt = document.createElement('option');
        opt.value = client.id;
        opt.textContent = `${client.name}${client.email ? ' (' + client.email + ')' : ''}`;
        select.appendChild(opt);
    });
    const container = select.closest('.custom-select');
    if (container) {
        const valueEl = container.querySelector('.custom-select-value');
        valueEl.textContent = t('invoiceForm.selectClient');
    }
}

export function renderClientList() {
    const listEl = document.getElementById('clientList');
    if (!listEl) return;
    const clients = this.token ? this.apiClients : this.storage.getClients();
    const t = (k, fallback) => typeof i18n !== 'undefined' ? i18n.t(k, fallback) : (fallback || k);
    if (clients.length === 0) {
        listEl.innerHTML = `<p style="padding: 2rem; text-align: center; color: var(--text-muted);">${t('clients.noClients', 'No clients saved yet')}</p>`;
        return;
    }

    const pageSize = this._pageSize || 20;
    const page = this._clientPage || 1;
    const totalPages = Math.max(1, Math.ceil(clients.length / pageSize));
    const safePage = Math.min(page, totalPages);
    this._clientPage = safePage;

    const start = (safePage - 1) * pageSize;
    const paged = clients.slice().reverse().slice(start, start + pageSize);
    const htmlRows = paged.map(client => `
        <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s ease;">
            <td style="padding: 1rem; vertical-align: middle;">
                <strong style="color: var(--text-main); font-size: 0.95rem;">${escapeHtml(client.name)}</strong>
            </td>
            <td style="padding: 1rem; vertical-align: middle;">
                <div style="font-size: 0.85rem; color: var(--text-main); margin-bottom: 0.25rem;">📧 ${escapeHtml(client.email) || t('clients.noEmail', 'No email')}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted);">📱 ${escapeHtml(client.phone) || t('clients.noPhone', 'No phone')}</div>
            </td>
            <td style="padding: 1rem; text-align: right; vertical-align: middle;">
                <div class="history-item-actions" style="display: flex; justify-content: flex-end; gap: 0.5rem;">
                    <button class="btn btn-primary btn-sm" data-action="load" data-client-id="${escapeHtml(client.id)}">Load to Invoice</button>
                    <button class="btn btn-danger btn-sm" data-action="delete" data-client-id="${escapeHtml(client.id)}">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
    listEl.innerHTML = `
<div class="dash-table-wrapper" style="overflow-x: auto;">
    <table class="dash-table" style="width: 100%; border-collapse: collapse;">
        <thead>
            <tr style="background: var(--bg-secondary); border-bottom: 2px solid var(--border);">
                <th style="padding: 1rem; text-align: left; font-size: 0.8rem; text-transform: uppercase;">Client Name</th>
                <th style="padding: 1rem; text-align: left; font-size: 0.8rem; text-transform: uppercase;">Contact Info</th>
                <th style="padding: 1rem; text-align: right; font-size: 0.8rem; text-transform: uppercase;">Actions</th>
            </tr>
        </thead>
        <tbody>
${htmlRows}
        </tbody>
    </table>
</div>
`;

    // Update pagination variables
    const clientPageTotalEl = document.getElementById('clientPageTotal');
    const clientPageStartEl = document.getElementById('clientPageStart');
    const clientPageEndEl = document.getElementById('clientPageEnd');
    if (clientPageTotalEl) clientPageTotalEl.textContent = clients.length;
    if (clientPageStartEl) clientPageStartEl.textContent = clients.length > 0 ? start + 1 : 0;
    if (clientPageEndEl) clientPageEndEl.textContent = Math.min(start + pageSize, clients.length);

    const prevBtn = document.querySelector('#clients .pagination .btn-secondary:first-child');
    const nextBtn = document.querySelector('#clients .pagination .btn-secondary:last-child');
    if (prevBtn) prevBtn.disabled = safePage <= 1;
    if (nextBtn) nextBtn.disabled = safePage >= totalPages;

    // Event delegation for client actions
    if (!listEl._clientsDelegated) {
        listEl._clientsDelegated = true;
        listEl.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;
            const clientId = target.dataset.clientId;
            const action = target.dataset.action;
            if (!clientId || !window.app) return;

            switch (action) {
                case 'load':
                    window.app.loadClientById(clientId);
                    break;
                case 'delete':
                    window.app.deleteClientById(clientId);
                    break;
            }
        });
    }
}

export function loadClientById(clientId) {
    const clients = this.token ? this.apiClients : this.storage.getClients();
    const client = clients.find(c => c.id === clientId);
    if (client) {
        document.getElementById('clientName').value = client.name || '';
        document.getElementById('clientEmail').value = client.email || '';
        document.getElementById('clientPhone').value = client.phone || '';
        document.getElementById('clientAddress').value = client.address || '';
        this.updateInvoiceFromForm();
        this.showInvoiceView();
        this.showNotification(`Loaded client: ${client.name}`, 'success');
    }
}

export function deleteClientById(clientId) {
    this.showConfirm('Are you sure you want to delete this client?').then(async (confirmed) => {
        if (!confirmed) return;
        let success;
        if (this.token) {
            success = await this.apiDeleteClient(clientId);
        } else {
            success = this.storage.deleteClient(clientId);
        }
        if (success) {
            if (this.token) {
                await this.apiGetClients();
            }
            this.renderClientList();
            this.renderClientDropdown();
            this.showNotification('Client deleted', 'success');
        } else {
            this.showNotification('Failed to delete client', 'error');
        }
    });
}

export function searchClients(term) {
    const listEl = document.getElementById('clientList');
    if (!listEl) return;
    const clients = this.token ? this.apiClients : this.storage.getClients();
    const results = term.trim()
        ? clients.filter(c =>
            (c.name && c.name.toLowerCase().includes(term.toLowerCase())) ||
            (c.email && c.email.toLowerCase().includes(term.toLowerCase())) ||
            (c.phone && c.phone.toLowerCase().includes(term.toLowerCase()))
        )
        : clients;
    if (results.length === 0) {
        const t = (k) => typeof i18n !== 'undefined' ? i18n.t(k) : k;
        listEl.innerHTML = `<p style="padding: 2rem; text-align: center; color: var(--text-muted);">${t('clients.noResults', 'No clients found')}</p>`;
        return;
    }
    const t = (k) => typeof i18n !== 'undefined' ? i18n.t(k) : k;
    const htmlRows = results.map(client => `
        <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s ease;">
            <td style="padding: 1rem; vertical-align: middle;">
                <strong style="color: var(--text-main); font-size: 0.95rem;">${escapeHtml(client.name)}</strong>
            </td>
            <td style="padding: 1rem; vertical-align: middle;">
                <div style="font-size: 0.85rem; color: var(--text-main); margin-bottom: 0.25rem;">📧 ${escapeHtml(client.email) || t('clients.noEmail', 'No email')}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted);">📱 ${escapeHtml(client.phone) || t('clients.noPhone', 'No phone')}</div>
            </td>
            <td style="padding: 1rem; text-align: right; vertical-align: middle;">
                <div class="history-item-actions" style="display: flex; justify-content: flex-end; gap: 0.5rem;">
                    <button class="btn btn-primary btn-sm" data-action="load" data-client-id="${escapeHtml(client.id)}">Load to Invoice</button>
                    <button class="btn btn-danger btn-sm" data-action="delete" data-client-id="${escapeHtml(client.id)}">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
    listEl.innerHTML = `
<div class="dash-table-wrapper" style="overflow-x: auto;">
    <table class="dash-table" style="width: 100%; border-collapse: collapse;">
        <thead>
            <tr style="background: var(--bg-secondary); border-bottom: 2px solid var(--border);">
                <th style="padding: 1rem; text-align: left; font-size: 0.8rem; text-transform: uppercase;">Client Name</th>
                <th style="padding: 1rem; text-align: left; font-size: 0.8rem; text-transform: uppercase;">Contact Info</th>
                <th style="padding: 1rem; text-align: right; font-size: 0.8rem; text-transform: uppercase;">Actions</th>
            </tr>
        </thead>
        <tbody>
${htmlRows}
        </tbody>
    </table>
</div>
`;
}

export function addClient() {
    document.getElementById('clientName').value = '';
    document.getElementById('clientEmail').value = '';
    document.getElementById('clientPhone').value = '';
    document.getElementById('clientAddress').value = '';
    this.showInvoiceView();
    // Focus client name input
    const input = document.getElementById('clientName');
    if (input) input.focus();
}
