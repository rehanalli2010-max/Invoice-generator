/**
 * Invoice History Module
 * Handles invoice history view, analytics dashboard, charts, and history CRUD
 */

import { API_BASE } from '../config.js';
import Invoice from '../invoice.js';
import { escapeHtml } from '../utils.js';

export function showInvoiceHistory() {
    if (this && typeof this.switchView === 'function') {
        this.switchView('history');
    } else {
        this.hideAllViews();
        this.updateHeader('History', 'View past invoices, check status, and generate reports');
        const histView = document.getElementById('history');
        if (histView) { histView.style.display = 'block'; histView.classList.add('active'); }
    }

    document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
    const histLink = document.getElementById('navHistory');
    if (histLink) histLink.classList.add('active');

    this.renderHistoryList();
    this.updateAnalyticsDashboard();
}

export function closeModal() {
    const modal = document.getElementById('historyModal');
    if (modal) {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
    document.body.style.removeProperty('overflow');
}

export function renderHistoryItem(inv) {
    const status = this.storage ? this.storage.getInvoiceStatus(inv) : (inv.status || 'draft');
    const statusClass = (status === 'Paid' || status === 'Completed') ? 'status-paid' : status === 'Overdue' ? 'status-danger' : status === 'Due Today' ? 'status-warning' : status === 'Draft' ? 'status-draft' : 'status-pending';
    let invSymbol = '$';
    try {
        if (typeof Invoice !== 'undefined') {
            invSymbol = new Invoice({ currency: inv.currency || 'USD' }).getCurrencySymbol();
        }
    } catch (e) {
        console.error(e);
    }
    const t = (k) => typeof i18n !== 'undefined' ? i18n.t(k) : k;
    const recurringBadge = inv.recurring && inv.recurring !== 'none' ? `<span class="recurring-badge">🔁 ${escapeHtml(inv.recurring)}</span>` : '';
    const tz = localStorage.getItem('invoice-tz') || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const paidDate = inv.paid_at ? new Date(inv.paid_at).toLocaleDateString(navigator.language, { timeZone: tz }) : null;
    const isEstimateOrQuote = inv.documentType === 'Estimate' || inv.documentType === 'Quote';
    const canConvert = isEstimateOrQuote && (status === 'Pending' || status === 'pending' || status === 'Sent' || status === 'sent');

    let transitionBtns = '';

    return `
        <tr class="history-item-row" style="border-bottom: 1px solid var(--border); transition: background 0.2s ease;">
            <td style="padding: 1rem; text-align: center; vertical-align: middle;">
                <input type="checkbox" class="bulk-checkbox" value="${escapeHtml(inv.id)}" data-invoice-id="${escapeHtml(inv.id)}" aria-label="Select invoice">
            </td>
            <td style="padding: 1rem; vertical-align: middle;" data-label="Invoice">
                <strong style="color: var(--text-main); font-size: 0.95rem;">${escapeHtml(inv.invoiceNumber) || 'INV-???'}</strong>
                ${recurringBadge}
                ${paidDate ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">Paid: ${paidDate}</div>` : ''}
            </td>
            <td style="padding: 1rem; vertical-align: middle;" data-label="Client">
                <span style="color: var(--text-main); font-size: 0.95rem;">${escapeHtml(inv.clientName) || 'Unknown Client'}</span>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">${escapeHtml(inv.clientEmail) || ''}</div>
            </td>
            <td style="padding: 1rem; text-align: right; vertical-align: middle;" data-label="Amount">
                <strong style="color: var(--text-main); font-size: 0.95rem; font-variant-numeric: tabular-nums;">${escapeHtml(invSymbol)}${(inv.total || 0).toFixed(2)}</strong>
            </td>
            <td style="padding: 1rem; text-align: center; vertical-align: middle;" data-label="Status">
                <span class="status-badge ${statusClass}" style="padding: 0.25rem 0.75rem; border-radius: 99px; font-size: 0.75rem; font-weight: 600;">${status}</span>
                ${transitionBtns}
            </td>
            <td style="padding: 1rem; text-align: right; vertical-align: middle;">
                <div class="history-item-actions" style="display: flex; justify-content: flex-end; gap: 0.5rem;">
                    <button class="btn btn-primary btn-sm" data-action="load" data-invoice-id="${escapeHtml(inv.id)}" title="Load">Load</button>
                    ${!isEstimateOrQuote && status !== 'Paid' && status !== 'paid' ? `<button class="btn btn-secondary btn-sm" data-action="pay-link" data-invoice-id="${escapeHtml(inv.id)}" title="Copy Pay Link">🔗</button>` : ''}
                    <button class="btn btn-secondary btn-sm" data-action="duplicate" data-invoice-id="${escapeHtml(inv.id)}" title="Duplicate">📋</button>
                    <button class="btn btn-danger btn-sm" data-action="delete" data-invoice-id="${escapeHtml(inv.id)}" title="Delete">🗑️</button>
                    ${canConvert ? `
                    <button class="btn btn-info btn-sm" data-action="convert" data-invoice-id="${escapeHtml(inv.id)}" title="Convert to Invoice">
                        <svg style="pointer-events: none;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16l-4-4 4-4"/><path d="M17 8l4 4-4 4"/><path d="M17 16H7"/><path d="M15 12H7"/></svg>
                    </button>` : ''}
                    ${(status === 'Pending' || status === 'pending' || status === 'Sent' || status === 'sent') ? `
                    <button class="btn btn-success btn-sm" data-action="mark-paid" data-invoice-id="${escapeHtml(inv.id)}" title="Mark as Paid">
                        <svg style="pointer-events: none;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </button>` : ''}

                </div>
            </td>
        </tr>
    `;
}

const tHeadHistory = `
<div class="dash-table-wrapper" style="overflow-x: auto;">
    <table class="dash-table" style="width: 100%; border-collapse: collapse;">
        <thead>
            <tr style="background: var(--bg-secondary); border-bottom: 2px solid var(--border);">
                <th style="padding: 1rem; width: 40px; text-align: center;"><input type="checkbox" onchange="window.app && window.app.toggleAllInvoices(this.checked)" aria-label="Select all"></th>
                <th style="padding: 1rem; text-align: left; font-size: 0.8rem; text-transform: uppercase;">Invoice</th>
                <th style="padding: 1rem; text-align: left; font-size: 0.8rem; text-transform: uppercase;">Client</th>
                <th style="padding: 1rem; text-align: right; font-size: 0.8rem; text-transform: uppercase;">Amount</th>
                <th style="padding: 1rem; text-align: center; font-size: 0.8rem; text-transform: uppercase;">Status</th>
                <th style="padding: 1rem; text-align: right; font-size: 0.8rem; text-transform: uppercase;">Actions</th>
            </tr>
        </thead>
        <tbody>
`;
const tFoot = `
        </tbody>
    </table>
</div>
`;

export async function renderHistoryList() {
    const listEl = document.getElementById('historyList');
    if (!listEl) return;
    let invoices = this.token ? await this.apiGetInvoices() : this.storage.getInvoices();
    invoices = this.getDateFilteredInvoices(invoices);
    if (invoices.length === 0) {
        listEl.innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--text-muted);">No invoices saved yet</p>';
        return;
    }

    const pageSize = this._pageSize || 20;
    const page = this._historyPage || 1;
    const totalPages = Math.max(1, Math.ceil(invoices.length / pageSize));
    const safePage = Math.min(page, totalPages);
    this._historyPage = safePage;

    const start = (safePage - 1) * pageSize;
    const paged = invoices.slice().reverse().slice(start, start + pageSize);
    const htmlRows = paged.map(inv => this.renderHistoryItem(inv)).join('');
    listEl.innerHTML = `${tHeadHistory}${htmlRows}${tFoot}`;

    const pageTotalEl = document.getElementById('pageTotal');
    const pageStartEl = document.getElementById('pageStart');
    const pageEndEl = document.getElementById('pageEnd');
    if (pageTotalEl) pageTotalEl.textContent = invoices.length;
    if (pageStartEl) pageStartEl.textContent = invoices.length > 0 ? start + 1 : 0;
    if (pageEndEl) pageEndEl.textContent = Math.min(start + pageSize, invoices.length);

    const prevBtn = document.querySelector('.pagination .btn-secondary:first-child');
    const nextBtn = document.querySelector('.pagination .btn-secondary:last-child');
    if (prevBtn) prevBtn.disabled = safePage <= 1;
    if (nextBtn) nextBtn.disabled = safePage >= totalPages;

    // Event delegation for history item actions
    if (!listEl._historyDelegated) {
        listEl._historyDelegated = true;
        listEl.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;
            const invoiceId = target.dataset.invoiceId;
            const action = target.dataset.action;
            if (!invoiceId || !window.app) return;

            switch (action) {
                case 'load':
                    window.app.loadInvoiceById(invoiceId);
                    break;
                case 'duplicate':
                    window.app.duplicateInvoice(invoiceId);
                    break;
                case 'pay-link':
                    window.app.generatePayLink(invoiceId);
                    break;
                case 'delete':
                    window.app.deleteInvoiceFromHistory(invoiceId);
                    break;
                case 'convert':
                    window.app.convertToInvoice(invoiceId);
                    break;
                case 'mark-paid':
                    console.log('mark-paid clicked for invoice ' + invoiceId);
                    if (window.app && typeof window.app.updateInvoiceStatus === 'function') {
                        // Let's use the app's existing built-in logic to update status
                        // the system transitions expect "paid", not "Paid" for the actual status enum
                        window.app.updateInvoiceStatus(invoiceId, 'paid');
                    } else if (window.app && window.app.storage) {
                        // Fallback 
                        const inv = window.app.storage.getInvoice(invoiceId);
                        if (inv) {
                            inv.status = 'paid'; 
                            window.app.storage.saveInvoice(inv);
                            if (typeof window.app.renderHistoryList === 'function') {
                                window.app.renderHistoryList();
                            }
                        }
                    }
                    break;
            }
        });

        // Status transition buttons
        listEl.addEventListener('click', (e) => {
            const target = e.target.closest('.status-btn[data-invoice-id]');
            if (!target) return;
            const invoiceId = target.dataset.invoiceId;
            const newStatus = target.dataset.newStatus;
            if (invoiceId && newStatus && window.app) {
                window.app.updateInvoiceStatus(invoiceId, newStatus);
            }
        });

        // Bulk checkboxes
        listEl.addEventListener('change', (e) => {
            if (e.target.matches('.bulk-checkbox')) {
                if (window.app) window.app.updateBulkActions();
            }
        });
    }
}

export async function updateAnalyticsDashboard() {
    const allInvoices = this.token ? this.apiInvoices : this.storage.getInvoices();
    const invoices = this.getDateFilteredInvoices(allInvoices);
    const total = invoices.length;
    const totals = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const average = total > 0 ? totals / total : 0;

    const statusCounts = invoices.reduce((counts, inv) => {
        const status = this.storage.getInvoiceStatus(inv);
        counts[status] = (counts[status] || 0) + 1;
        return counts;
    }, {});

    const symbol = this.invoice ? this.invoice.getCurrencySymbol() : '$';
    const totalRevenueEl = document.getElementById('totalRevenue');
    const pendingCountEl = document.getElementById('pendingCount');
    const overdueCountEl = document.getElementById('overdueCount');
    const averageInvoiceEl = document.getElementById('averageInvoice');
    const totalInvoicesEl = document.getElementById('totalInvoices');

    if (totalRevenueEl) totalRevenueEl.textContent = symbol + totals.toFixed(2);
    if (pendingCountEl) pendingCountEl.textContent = statusCounts['Pending'] || 0;
    if (overdueCountEl) overdueCountEl.textContent = statusCounts['Overdue'] || 0;
    if (averageInvoiceEl) averageInvoiceEl.textContent = symbol + average.toFixed(2);
    if (totalInvoicesEl) totalInvoicesEl.textContent = total;

    await this.renderCharts(invoices);
    this.renderMonthlyHeatmap(allInvoices);
}

export async function renderCharts(invoices) {
    const t = (k) => typeof i18n !== 'undefined' ? i18n.t(k) : k;
    const sym = this.invoice ? this.invoice.getCurrencySymbol() : '$';

    // Singleton promise for Chart.js loading to prevent multiple simultaneous imports
    if (typeof Chart === 'undefined') {
        if (!window._chartJsLoadPromise) {
            window._chartJsLoadPromise = (async () => {
                try {
                    const module = await import('https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js');
                    window.Chart = module.Chart || module.default || module;
                } catch (e) {
                    window.Chart = null;
                    throw e;
                }
            })();
        }
        try {
            await window._chartJsLoadPromise;
        } catch (e) {
            return;
        }
    }

    // Revenue over time (line chart)
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx && invoices.length > 0) {
        const sorted = [...invoices].sort((a, b) => new Date(a.invoiceDate || a.createdAt) - new Date(b.invoiceDate || b.createdAt));
        const dates = sorted.map(inv => {
            const d = new Date(inv.invoiceDate || inv.createdAt || Date.now());
            return d.toLocaleDateString();
        });
        const revenues = sorted.map(inv => inv.total || 0);

        if (window._revenueChart) window._revenueChart.destroy();
        window._revenueChart = new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: t('charts.revenueOverTime'),
                    data: revenues,
                    borderColor: '#5e6ad2',
                    backgroundColor: 'rgba(94, 106, 210, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        position: 'nearest',
                        intersect: false,
                        padding: 10,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        displayColors: false,
                        borderWidth: 0
                    }
                },
                layout: {
                    padding: { left: 10, right: 10 }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { callback: (v) => sym + v.toFixed(0) }
                    }
                }
            }
        });
    }

    // Status breakdown (pie chart)
    const statusCtx = document.getElementById('statusChart');
    if (statusCtx && invoices.length > 0) {
        const statusCounts = invoices.reduce((counts, inv) => {
            const status = this.storage.getInvoiceStatus(inv);
            counts[status] = (counts[status] || 0) + 1;
            return counts;
        }, {});

        const statusLabels = Object.keys(statusCounts);
        const statusData = Object.values(statusCounts);
        const colors = {
            'Paid': '#22c55e',
            'Pending': '#f59e0b',
            'Overdue': '#ef4444',
            'Due Today': '#3b82f6'
        };

        if (window._statusChart) window._statusChart.destroy();
        window._statusChart = new Chart(statusCtx, {
            type: 'pie',
            data: {
                labels: statusLabels,
                datasets: [{
                    data: statusData,
                    backgroundColor: statusLabels.map(l => colors[l] || '#6b7280')
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12, padding: 10 }
                    }
                }
            }
        });
    }

    // Top clients (bar chart)
    const clientsCtx = document.getElementById('clientsChart');
    if (clientsCtx && invoices.length > 0) {
        const clientTotals = invoices.reduce((sums, inv) => {
            const name = inv.clientName || 'Unknown';
            sums[name] = (sums[name] || 0) + (inv.total || 0);
            return sums;
        }, {});

        const sortedClients = Object.entries(clientTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const clientLabels = sortedClients.map(([name]) => name);
        const clientValues = sortedClients.map(([, total]) => total);

        if (window._clientsChart) window._clientsChart.destroy();
        window._clientsChart = new Chart(clientsCtx, {
            type: 'bar',
            data: {
                labels: clientLabels,
                datasets: [{
                    label: t('charts.topClients'),
                    data: clientValues,
                    backgroundColor: 'rgba(94, 106, 210, 0.7)',
                    borderColor: '#5e6ad2',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        position: 'nearest',
                        intersect: false,
                        padding: 10,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        displayColors: false,
                        borderWidth: 0
                    }
                },
                layout: {
                    padding: { left: 10, right: 10 }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { callback: (v) => sym + v.toFixed(0) }
                    }
                }
            }
        });
    }
}

export async function searchHistory(term) {
    const listEl = document.getElementById('historyList');
    if (!listEl) return;
    let allInvoices = this.token ? this.apiInvoices : this.storage.getInvoices();
    allInvoices = this.getDateFilteredInvoices(allInvoices);
    const results = term.trim()
        ? allInvoices.filter(inv =>
            (inv.clientName && inv.clientName.toLowerCase().includes(term.toLowerCase())) ||
            (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(term.toLowerCase())) ||
            (inv.clientEmail && inv.clientEmail.toLowerCase().includes(term.toLowerCase())) ||
            (inv.notes && inv.notes.toLowerCase().includes(term.toLowerCase()))
        )
        : allInvoices;

    // Reset to first page when searching
    this._historyPage = 1;

    if (results.length === 0) {
        listEl.innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--text-muted);">No invoices found</p>';
        return;
    }

    // Apply pagination to search results
    const pageSize = this._pageSize || 20;
    const page = this._historyPage || 1;
    const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
    const safePage = Math.min(page, totalPages);
    this._historyPage = safePage;
    const start = (safePage - 1) * pageSize;
    const paged = results.slice().reverse().slice(start, start + pageSize);
    const htmlRows = paged.map(inv => this.renderHistoryItem(inv)).join('');
    listEl.innerHTML = `${tHeadHistory}${htmlRows}${tFoot}`;

    // Update pagination display
    const pageTotalEl = document.getElementById('pageTotal');
    const pageStartEl = document.getElementById('pageStart');
    const pageEndEl = document.getElementById('pageEnd');
    if (pageTotalEl) pageTotalEl.textContent = results.length;
    if (pageStartEl) pageStartEl.textContent = results.length > 0 ? start + 1 : 0;
    if (pageEndEl) pageEndEl.textContent = Math.min(start + pageSize, results.length);

    const prevBtn = document.querySelector('.pagination .btn-secondary:first-child');
    const nextBtn = document.querySelector('.pagination .btn-secondary:last-child');
    if (prevBtn) prevBtn.disabled = safePage <= 1;
    if (nextBtn) nextBtn.disabled = safePage >= totalPages;
}

export async function filterHistory(status) {
    const listEl = document.getElementById('historyList');
    if (!listEl) return;
    let allInvoices = this.token ? this.apiInvoices : this.storage.getInvoices();
    allInvoices = this.getDateFilteredInvoices(allInvoices);
    const results = status && status !== 'all'
        ? allInvoices.filter(inv => {
            if (status === 'recurring') {
                return inv.recurring && inv.recurring !== 'none';
            }
            if (this.token) {
                return (inv.status || 'draft').toLowerCase() === status.toLowerCase();
            } else {
                return this.storage.getInvoiceStatus(inv).toLowerCase() === status.toLowerCase();
            }
        })
        : allInvoices;

    // Reset to first page when filtering
    this._historyPage = 1;

    if (results.length === 0) {
        listEl.innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--text-muted);">No invoices found</p>';
        return;
    }

    // Apply pagination to filter results
    const pageSize = this._pageSize || 20;
    const page = this._historyPage || 1;
    const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
    const safePage = Math.min(page, totalPages);
    this._historyPage = safePage;
    const start = (safePage - 1) * pageSize;
    const paged = results.slice().reverse().slice(start, start + pageSize);
    const htmlRows = paged.map(inv => this.renderHistoryItem(inv)).join('');
    listEl.innerHTML = `${tHeadHistory}${htmlRows}${tFoot}`;

    // Update pagination display
    const pageTotalEl = document.getElementById('pageTotal');
    const pageStartEl = document.getElementById('pageStart');
    const pageEndEl = document.getElementById('pageEnd');
    if (pageTotalEl) pageTotalEl.textContent = results.length;
    if (pageStartEl) pageStartEl.textContent = results.length > 0 ? start + 1 : 0;
    if (pageEndEl) pageEndEl.textContent = Math.min(start + pageSize, results.length);

    const prevBtn = document.querySelector('.pagination .btn-secondary:first-child');
    const nextBtn = document.querySelector('.pagination .btn-secondary:last-child');
    if (prevBtn) prevBtn.disabled = safePage <= 1;
    if (nextBtn) nextBtn.disabled = safePage >= totalPages;
}

export function toggleAllInvoices(checked) {
    const checkboxes = document.querySelectorAll('#historyList .bulk-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = checked;
    });
    this.updateBulkActions();
}

export async function loadInvoiceById(id) {
    let invoiceData;
    if (this.token) {
        invoiceData = this.apiInvoices.find(inv => String(inv.id) === String(id));
    } else {
        invoiceData = this.storage.getInvoice(id);
    }
    if (invoiceData) {
        this.loadInvoice(invoiceData);
        this.showInvoiceView();
        if (this.showTypewriter) {
            this.showTypewriter('Invoice Loaded', { typingSpeed: 45 });
        }
        this.showNotification(`Loaded invoice #${invoiceData.invoiceNumber}`, 'success');
    }
}

export async function deleteInvoiceFromHistory(id) {
    this.showConfirm('Are you sure you want to delete this invoice?').then(async (confirmed) => {
        if (!confirmed) return;
        let success;
        if (this.token) {
            success = await this.apiDeleteInvoice(id);
        } else {
            success = this.storage.deleteInvoice(id);
        }
        if (success) {
            await this.renderHistoryList();
            await this.updateAnalyticsDashboard();
            this.showNotification('Invoice deleted', 'success');
        }
    });
}

export function clearAllData() {
    this.showConfirm('Are you sure you want to delete ALL saved invoices? This cannot be undone.').then(async (confirmed) => {
        if (!confirmed) return;
        if (this.token) {
            const ids = this.apiInvoices.map(inv => inv.id);
            for (const id of ids) {
                await this.apiDeleteInvoice(id);
            }
        } else {
            this.storage.clearAllInvoices();
        }
        this.showNotification('All data cleared', 'success');
        this.hideAllViews();
        document.getElementById('home').style.display = 'block';
        await this.updateAnalyticsDashboard();
        if (!this.token) {
            document.getElementById('invoiceNumber').value = this.storage.peekNextInvoiceNumber();
        }
        this.updateInvoiceFromForm();
    });
}

export async function togglePaymentStatus(id) {
    let success;
    if (this.token) {
        const inv = this.apiInvoices.find(i => String(i.id) === String(id));
        if (inv) {
            const newStatus = inv.status === 'paid' ? 'sent' : 'paid';
            try {
                await this.apiUpdateInvoiceStatus(id, newStatus);
                inv.status = newStatus;
                success = true;
            } catch (e) {
                this.showNotification('Failed to update status', 'error');
                return;
            }
        }
    } else {
        success = this.storage.togglePaymentStatus(id);
    }
    if (success) {
        await this.renderHistoryList();
        await this.updateAnalyticsDashboard();
        const label = (this.token ? this.apiInvoices : this.storage.getInvoices())
            .find(i => String(i.id) === String(id))?.status === 'paid' ? 'Marked as Paid' : 'Marked as Unpaid';
        this.showNotification(label, 'success');
    }
}

export async function convertToInvoice(id) {
    let success = false;
    if (this.token) {
        try {
            const data = await this.apiConvertToInvoice(id);
            if (data.success) {
                // Refresh invoices list
                await this.apiGetInvoices();
                success = true;
            }
        } catch (e) {
            this.showNotification(e.message || 'Failed to convert to invoice', 'error');
            return;
        }
    } else {
        // Local mode conversion
        const invoices = this.storage.getInvoices();
        const inv = invoices.find(i => String(i.id) === String(id));
        if (!inv || !['Estimate', 'Quote'].includes(inv.documentType)) {
            this.showNotification('Only Estimates and Quotes can be converted', 'error');
            return;
        }
        // Create new invoice from the estimate/quote
        const data = { ...inv };
        data.documentType = 'Invoice';
        data.invoiceNumber = inv.invoiceNumber ? inv.invoiceNumber.replace(/(\d+)$/, m => String(parseInt(m) + 1).padStart(m.length, '0')) : 'INV-001-CONV';
        data.invoiceDate = new Date().toISOString().split('T')[0];
        data.dueDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
        data.status = 'draft';
        data.id = undefined;
        data.createdAt = new Date().toISOString();
        this.storage.saveInvoice(data);
        // Mark original as accepted
        inv.status = 'accepted';
        this.storage.saveInvoice(inv);
        success = true;
    }
    if (success) {
        await this.renderHistoryList();
        await this.updateAnalyticsDashboard();
        this.showNotification('Converted to Invoice successfully', 'success');
    }
}

export async function generatePayLink(id) {
    if (this.token) {
        try {
            await this.apiGetPaymentLink(id);
            // Instead of just calling it for the URL, we know the static predictable URL we built in invoices.js GET /:id/pay
            const link = `${window.location.origin}/api/invoices/${id}/pay`;
            navigator.clipboard.writeText(link).then(() => {
                this.showNotification('Payment link copied to clipboard', 'success');
            }).catch(() => {
                this.showNotification(`Payment link: ${link}`, 'info');
            });
        } catch (e) {
            this.showNotification(e.message || 'Failed to generate payment link', 'error');
        }
    } else {
        this.showNotification('Please Sign In to use Stripe Checkout payments', 'info');
    }
}

export async function generateNextInvoice(id) {
    let inv;
    if (this.token) {
        inv = this.apiInvoices.find(inv => String(inv.id) === String(id));
    } else {
        inv = this.storage.getInvoice(id);
    }
    if (!inv) return;

    const newInvoice = { ...inv };
    delete newInvoice.id;
    delete newInvoice.createdAt;
    delete newInvoice.updatedAt;

    newInvoice.invoiceNumber = this.storage.getNextInvoiceNumber();

    const intervals = { weekly: 7, monthly: 30, quarterly: 90 };
    const days = intervals[inv.recurring] || 30;
    const baseDate = new Date(inv.invoiceDate || Date.now());
    const newDate = new Date(baseDate);
    newDate.setDate(newDate.getDate() + days);
    newInvoice.invoiceDate = newDate.toISOString().split('T')[0];

    const dueBase = new Date(inv.dueDate || inv.invoiceDate || Date.now());
    const newDue = new Date(dueBase);
    newDue.setDate(newDue.getDate() + days);
    newInvoice.dueDate = newDue.toISOString().split('T')[0];

    newInvoice.status = 'draft';

    let success;
    try {
        if (this.token) {
            success = await this.apiSaveInvoice(newInvoice);
        } else {
            success = this.storage.saveInvoice(newInvoice);
        }
    } catch (err) {
        this.showNotification(err.message || 'Failed to save invoice', 'error');
        return;
    }

    if (success) {
        if (this.token) {
            await this.apiGetInvoices();
        }
        this.renderHistoryList();
        this.updateAnalyticsDashboard();
        this.showNotification(`Generated ${newInvoice.invoiceNumber}`, 'success');
    }
}

export async function sendInvoiceToClient(id) {
    const t = (k) => typeof i18n !== 'undefined' ? i18n.t(k) : k;

    if (this.token) {
        try {
            const result = await this.apiSendInvoice(id);
            if (result && result.success) {
                this.showNotification(result.message || t('email.sent'), 'success');
                await this.renderHistoryList();
                await this.updateAnalyticsDashboard();
            }
        } catch (err) {
            if (err.message && err.message.includes('Email configuration')) {
                this.showEmailConfigModal();
            } else {
                this.showNotification(err.message || 'Failed to send invoice', 'error');
            }
        }
    } else {
        this.showNotification('Please sign in to send invoices via email', 'info');
        this.showAuthModal();
    }
}

export async function duplicateInvoice(id) {
    let success;
    if (this.token) {
        try {
            await this.apiDuplicateInvoice(id);
            success = true;
        } catch (e) {
            success = false;
        }
    } else {
        success = this.storage.duplicateInvoice(id);
    }

    if (success) {
        if (this.token) {
            await this.apiGetInvoices();
        }
        await this.renderHistoryList();
        await this.updateAnalyticsDashboard();
        this.showNotification('Invoice duplicated', 'success');
    } else {
        this.showNotification('Failed to duplicate invoice', 'error');
    }
}

export async function updateInvoiceStatus(id, newStatus) {
    const t = (k) => typeof i18n !== 'undefined' ? i18n.t(k) : k;
    let success;

    if (this.token) {
        try {
            await this.apiUpdateInvoiceStatus(id, newStatus);
            const inv = this.apiInvoices.find(i => String(i.id) === String(id));
            if (inv) inv.status = newStatus;
            success = true;
        } catch (err) {
            this.showNotification(err.message || 'Failed to update status', 'error');
            return;
        }
    } else {
        const inv = this.storage.getInvoice(id);
        if (inv) {
            inv.status = newStatus;
            try {
                success = this.storage.saveInvoice(inv);
            } catch (err) {
                this.showNotification(err.message || 'Failed to save invoice', 'error');
                return;
            }
        } else {
            success = false;
        }
    }

    if (success) {
        await this.renderHistoryList();
        await this.updateAnalyticsDashboard();
        this.showNotification(`Status updated to ${newStatus}`, 'success');
    }
}

export function showEmailConfigModal() {
    const t = (k) => typeof i18n !== 'undefined' ? i18n.t(k) : k;
    let modal = document.getElementById('emailConfigModal');
    if (!modal) {
        const div = document.createElement('div');
        div.id = 'emailConfigModal';
        div.className = 'modal';
        div.setAttribute('role', 'dialog');
        div.setAttribute('aria-modal', 'true');
        div.setAttribute('aria-hidden', 'true');
        div.innerHTML = `
            <div class="modal-content" style="max-width: 550px;">
                <div class="modal-header">
                    <h2>${t('email.configure')}</h2>
                    <button class="close-btn" onclick="document.getElementById('emailConfigModal').classList.remove('show')" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="emailConfigForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="smtpHost">${t('email.host')}</label>
                                <input type="text" id="smtpHost" placeholder="smtp.gmail.com" required>
                            </div>
                            <div class="form-group">
                                <label for="smtpPort">${t('email.port')}</label>
                                <input type="number" id="smtpPort" value="587" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="smtpSecure"> ${t('email.secure')}
                                </label>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="smtpUser">${t('email.user')}</label>
                                <input type="text" id="smtpUser" placeholder="your@email.com" required>
                            </div>
                            <div class="form-group">
                                <label for="smtpPass">${t('email.pass')}</label>
                                <input type="password" id="smtpPass" placeholder="App password or SMTP password" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="smtpFromName">${t('email.fromName')}</label>
                                <input type="text" id="smtpFromName" placeholder="Your Company Name">
                            </div>
                            <div class="form-group">
                                <label for="smtpFromEmail">${t('email.fromEmail')}</label>
                                <input type="email" id="smtpFromEmail" placeholder="noreply@yourcompany.com">
                            </div>
                        </div>
                        <hr style="margin:1rem 0;">
                        <h4 style="margin:0 0 0.75rem;">Email Template Customization</h4>
                        <div class="form-row">
                            <div class="form-group" style="grid-column:1/-1;">
                                <label for="emailSubjectTemplate">Subject Template</label>
                                <input type="text" id="emailSubjectTemplate" placeholder="{{documentType}} #{{invoiceNumber}} from {{companyName}}">
                                <small style="color:var(--text-muted);">Use: {{documentType}} {{invoiceNumber}} {{companyName}} {{clientName}} {{total}} {{currency}}</small>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="emailAccentColor">Accent Color</label>
                                <input type="color" id="emailAccentColor" value="#5e6ad2">
                            </div>
                            <div class="form-group">
                                <label for="emailBodyBg">Background Color</label>
                                <input type="color" id="emailBodyBg" value="#ffffff">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="emailShowLogo" checked> Show company logo in email
                                </label>
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem;">
                            <button type="button" class="btn btn-secondary" id="emailConfigCancel">${t('actions.cancel')}</button>
                            <button type="submit" class="btn btn-primary">${t('email.save')}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(div);
        modal = div;

        document.getElementById('emailConfigForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const config = {
                host: document.getElementById('smtpHost').value,
                port: parseInt(document.getElementById('smtpPort').value) || 587,
                secure: document.getElementById('smtpSecure').checked,
                user: document.getElementById('smtpUser').value,
                pass: document.getElementById('smtpPass').value,
                from_name: document.getElementById('smtpFromName').value,
                from_email: document.getElementById('smtpFromEmail').value,
                email_subject_template: document.getElementById('emailSubjectTemplate').value,
                email_accent_color: document.getElementById('emailAccentColor').value,
                email_body_bg: document.getElementById('emailBodyBg').value,
                email_show_logo: document.getElementById('emailShowLogo').checked
            };
            try {
                if (await this.apiSaveEmailConfig(config)) {
                    this.showNotification('Email configuration saved', 'success');
                    modal.classList.remove('show');
                    modal.setAttribute('aria-hidden', 'true');
                    document.body.style.overflow = '';
                }
            } catch (err) {
                this.showNotification(err.message || 'Failed to save email configuration', 'error');
            }
        });

        document.getElementById('emailConfigCancel').addEventListener('click', () => {
            modal.classList.remove('show');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        });

        modal._backdropHandler = (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                modal.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            }
        };
        window.addEventListener('click', modal._backdropHandler);
    }

    // Clean up any previous backdrop listener before re-adding
    if (modal._backdropHandler) {
        window.removeEventListener('click', modal._backdropHandler);
    }

    if (this.token) {
      this.apiGetEmailConfig().then(config => {
        if (config) {
          if (document.getElementById('smtpHost')) document.getElementById('smtpHost').value = config.host || '';
          if (document.getElementById('smtpPort')) document.getElementById('smtpPort').value = config.port || 587;
          if (document.getElementById('smtpSecure')) document.getElementById('smtpSecure').checked = config.secure === 1;
          if (document.getElementById('smtpUser')) document.getElementById('smtpUser').value = config.user || '';
          if (document.getElementById('smtpFromName')) document.getElementById('smtpFromName').value = config.from_name || '';
          if (document.getElementById('smtpFromEmail')) document.getElementById('smtpFromEmail').value = config.from_email || '';
          if (document.getElementById('emailSubjectTemplate')) document.getElementById('emailSubjectTemplate').value = config.email_subject_template || '';
          if (document.getElementById('emailAccentColor')) document.getElementById('emailAccentColor').value = config.email_accent_color || '#5e6ad2';
          if (document.getElementById('emailBodyBg')) document.getElementById('emailBodyBg').value = config.email_body_bg || '#ffffff';
          if (document.getElementById('emailShowLogo')) document.getElementById('emailShowLogo').checked = config.email_show_logo !== 0;
        }
      }).catch(() => {});
    }

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    window.addEventListener('click', modal._backdropHandler);
}

export async function filterByDateRange(range) {
    this._dateRange = range;
    this._historyPage = 1;

    const buttons = document.querySelectorAll('#timeFilterButtons .time-filter-btn');
    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.range === range);
    });

    await this.renderHistoryList();
    await this.updateAnalyticsDashboard();
}

export function getDateFilteredInvoices(invoices) {
    const range = this._dateRange;
    if (!range || range === 'all') return invoices;

    const days = parseInt(range, 10);
    if (isNaN(days)) return invoices;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    cutoff.setHours(0, 0, 0, 0);

    return invoices.filter(inv => {
        const dateStr = inv.invoiceDate || inv.createdAt;
        if (!dateStr) return false;
        return new Date(dateStr) >= cutoff;
    });
}

export function renderMonthlyHeatmap(invoices) {
    const container = document.getElementById('monthlyHeatmap');
    if (!container) return;

    if (!invoices || invoices.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    const monthCounts = {};
    let minDate = null;
    let maxDate = null;

    invoices.forEach(inv => {
        const dateStr = inv.invoiceDate || inv.createdAt;
        if (!dateStr) return;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthCounts[key] = (monthCounts[key] || 0) + 1;
        if (!minDate || d < minDate) minDate = new Date(d);
        if (!maxDate || d > maxDate) maxDate = new Date(d);
    });

    if (!minDate || !maxDate) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    const now = new Date();
    if (maxDate < now) maxDate = now;

    const startYear = minDate.getFullYear();
    const startMonth = minDate.getMonth();
    const endYear = maxDate.getFullYear();
    const endMonth = maxDate.getMonth();

    const months = [];
    for (let y = startYear; y <= endYear; y++) {
        const mStart = (y === startYear) ? startMonth : 0;
        const mEnd = (y === endYear) ? endMonth : 11;
        for (let m = mStart; m <= mEnd; m++) {
            const key = `${y}-${String(m + 1).padStart(2, '0')}`;
            months.push({ year: y, month: m, key, count: monthCounts[key] || 0 });
        }
    }

    const maxCount = Math.max(...months.map(m => m.count), 1);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const yearGroups = {};
    months.forEach(m => {
        if (!yearGroups[m.year]) yearGroups[m.year] = [];
        yearGroups[m.year].push(m);
    });

    let html = '<div class="heatmap-header"><h3>Monthly Activity</h3><div class="heatmap-legend"><span class="heatmap-legend-label">Less</span>';
    const levels = [0, 0.25, 0.5, 0.75, 1];
    levels.forEach(l => {
        html += `<span class="heatmap-legend-cell" style="opacity: ${0.15 + l * 0.85}; background: var(--primary);"></span>`;
    });
    html += '<span class="heatmap-legend-label">More</span></div></div>';

    html += '<div class="heatmap-grid">';
    for (const [year, yearMonths] of Object.entries(yearGroups)) {
        html += `<div class="heatmap-year-row"><span class="heatmap-year-label">${year}</span><div class="heatmap-months">`;
        for (let m = 0; m < 12; m++) {
            const entry = yearMonths.find(ym => ym.month === m);
            if (entry) {
                const intensity = entry.count / maxCount;
                const opacity = entry.count === 0 ? 0.08 : (0.2 + intensity * 0.8);
                html += `<div class="heatmap-cell" title="${monthNames[m]} ${year}: ${entry.count} invoice${entry.count !== 1 ? 's' : ''}" style="opacity: ${opacity}; background: var(--primary);"><span class="heatmap-month-label">${monthNames[m]}</span><span class="heatmap-count">${entry.count}</span></div>`;
            } else {
                html += `<div class="heatmap-cell heatmap-cell-empty"><span class="heatmap-month-label">${monthNames[m]}</span></div>`;
            }
        }
        html += '</div></div>';
    }
    html += '</div>';

    container.innerHTML = html;
    container.style.display = 'block';
}
