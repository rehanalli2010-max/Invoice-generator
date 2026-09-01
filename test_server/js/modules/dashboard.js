/**
 * Dashboard Analytics Module
 * Modern, clean implementation with proper separation of concerns
 */

import Invoice from '../invoice.js';
import { escapeHtml } from '../utils.js';

/**
 * Currency symbol lookup
 */
const CURRENCY_SYMBOLS = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'C$',
    AUD: 'A$',
    INR: '₹',
    JPY: '¥',
    PKR: 'Rs',
    BDT: '৳',
    LKR: 'Rs',
    NPR: 'Rs',
    AED: 'AED',
    SAR: 'SAR',
    CNY: '¥',
    KRW: '₩',
    SGD: 'S$',
    MYR: 'RM',
    IDR: 'Rp',
    THB: '฿',
    NGN: '₦',
    ZAR: 'R',
    KES: 'KSh',
    BRL: 'R$',
    MXN: 'MX$',
};

/**
 * Status colors for charts
 */
const STATUS_COLORS = {
    Paid: '#22c55e',
    Pending: '#f59e0b',
    Overdue: '#ef4444',
    'Due Today': '#3b82f6',
    Sent: '#6366f1',
    Draft: '#9ca3af',
};

/**
 * Chart color palette for client charts
 */
const CHART_PALETTE = [
    '#5e6ad2', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
];

/**
 * Chart.js loader - singleton promise
 */
let _chartJsPromise = null;
async function loadChartJs() {
    if (typeof Chart !== 'undefined') return true;
    if (!_chartJsPromise) {
        _chartJsPromise = (async () => {
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
        await _chartJsPromise;
        return true;
    } catch (e) {
        console.error('Failed to load Chart.js:', e);
        return false;
    }
}

/**
 * Get currency symbol from invoice data
 */
function getSymbol(invoice) {
    if (!invoice) return '$';
    const inv = new Invoice({ currency: invoice.currency || 'USD' });
    return inv.getCurrencySymbol();
}

/**
 * Get currency symbol by currency code
 */
function getSymbolByCode(code) {
    return CURRENCY_SYMBOLS[code] || code || '$';
}

/**
 * Format number with thousands separator
 */
function formatNumber(num, decimals = 2) {
    return Number(num || 0).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format currency with symbol
 */
function formatCurrency(amount, symbol, decimals = 2) {
    return `${symbol}${formatNumber(amount, decimals)}`;
}

/**
 * Get locale for date formatting
 */
function getLocale() {
    if (typeof i18n !== 'undefined' && i18n.locales?.[i18n.currentLocale]?.currencyLocale) {
        return i18n.locales[i18n.currentLocale].currencyLocale;
    }
    return 'en-US';
}

/**
 * Check if dark theme is active
 */
function isDarkTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
}

/**
 * Get theme-aware colors
 */
function getThemeColors() {
    const dark = isDarkTheme();
    return {
        gridColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        textColor: dark ? '#94a3b8' : '#64748b',
        tooltipBg: dark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)',
        tooltipTitle: dark ? '#e2e8f0' : '#1e293b',
        tooltipBody: dark ? '#cbd5e1' : '#475569',
        tooltipBorder: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    };
}

/**
 * Destroy chart if exists
 */
function destroyChart(chartRef) {
    if (chartRef && typeof chartRef.destroy === 'function') {
        chartRef.destroy();
    }
}

/**
 * Main Dashboard class
 */
export class Dashboard {
    constructor(appContext) {
        this.app = appContext;
        this.charts = new Map();
        this.filterRange = '6m';
        this.cachedInvoices = null;
        this.cachedSymbol = '$';
    }

    /**
     * Main entry point - render the entire dashboard
     */
    async render() {
        // Reset filter state
        this.filterRange = '6m';

        // Fetch invoices
        const invoices = this.app.token
            ? await this.app.apiGetInvoices()
            : this.app.storage.getInvoices();

        this.cachedInvoices = invoices;
        this.cachedSymbol = invoices.length > 0 ? getSymbol(invoices[0]) : '$';

        // Render stat cards
        this.renderStatCards(invoices);

        // Initialize filter buttons
        this.initFilterButtons();

        // Load Chart.js and render charts
        if (await loadChartJs()) {
            this.renderAllCharts(invoices, this.cachedSymbol);
        }

        // Render top clients list
        this.renderTopClients(invoices, this.cachedSymbol);
    }

    /**
     * Render the 6 stat cards at the top
     */
    renderStatCards(invoices) {
        const total = invoices.length;
        const totals = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const average = total > 0 ? totals / total : 0;

        // Calculate status counts
        const statusCounts = invoices.reduce((counts, inv) => {
            const status = this.app.storage
                ? this.app.storage.getInvoiceStatus(inv)
                : (inv.status || 'draft');
            counts[status] = (counts[status] || 0) + 1;
            return counts;
        }, {});

        const recurringCount = invoices.filter(inv =>
            inv.recurring && inv.recurring !== 'none'
        ).length;

        const symbol = this.cachedSymbol;

        // Update DOM elements
        this.updateElement('dashTotalRevenue', formatCurrency(totals, symbol));
        this.updateElement('dashTotalInvoices', total.toString());
        this.updateElement('dashAverageInvoice', formatCurrency(average, symbol));
        this.updateElement('dashPendingCount',
            (statusCounts['Pending'] || 0) + (statusCounts['Sent'] || 0));
        this.updateElement('dashOverdueCount', statusCounts['Overdue'] || 0);
        this.updateElement('dashRecurringCount', recurringCount);

        // Key insights card
        this.updateElement('dashRevenue', formatCurrency(totals, symbol));
        this.updateElement('dashRevenueGrowth', `${total} invoices`);
    }

    /**
     * Update a DOM element safely
     */
    updateElement(id, content) {
        const el = document.getElementById(id);
        if (el) el.textContent = content;
    }

    /**
     * Initialize filter buttons for revenue chart
     */
    initFilterButtons() {
        const container = document.getElementById('revenueChartFilters');
        if (!container) return;

        container.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.range === '6m');
        });

        // Remove existing listener to avoid duplicates
        container.removeEventListener('click', this._filterHandler);
        this._filterHandler = (e) => {
            const btn = e.target.closest('.filter-btn');
            if (!btn) return;

            container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.filterRange = btn.dataset.range;

            if (this.cachedInvoices) {
                this.renderRevenueSmallChart(this.cachedInvoices, this.cachedSymbol);
            }
        };
        container.addEventListener('click', this._filterHandler);
    }

    /**
     * Render all charts
     */
    renderAllCharts(invoices, symbol) {
        this.renderRevenueSmallChart(invoices, symbol);
        this.renderStatusSmallChart(invoices);
        this.renderRevenueCostsChart(invoices, symbol);
        this.renderPerClientIncomeChart(invoices, symbol);
        this.renderKeyInsightsChart(invoices, symbol);
        this.renderProjectedEarningsChart(invoices, symbol);
        this.renderARAgingChart(invoices, symbol);
    }

    /**
     * Revenue over time (small chart with filters)
     */
    renderRevenueSmallChart(invoices, symbol) {
        const ctx = document.getElementById('revenueChartSmall');
        if (!ctx) return;

        const colors = getThemeColors();
        const locale = getLocale();

        // Group by month
        const byMonth = new Map();
        for (const inv of invoices) {
            const d = new Date(inv.invoiceDate || inv.createdAt || Date.now());
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!byMonth.has(key)) {
                byMonth.set(key, { date: new Date(d.getFullYear(), d.getMonth(), 1), total: 0 });
            }
            byMonth.get(key).total += (inv.total || 0);
        }

        const sorted = [...byMonth.values()].sort((a, b) => a.date - b.date);
        if (sorted.length === 1) {
            const prev = new Date(sorted[0].date);
            prev.setMonth(prev.getMonth() - 1);
            sorted.unshift({ date: prev, total: 0 });
        }

        // Apply filter
        let filtered = sorted;
        if (this.filterRange === '6m') filtered = sorted.slice(-6);
        else if (this.filterRange === '12m') filtered = sorted.slice(-12);

        const labels = filtered.map(b => b.date.toLocaleDateString(locale, { month: 'short', year: '2-digit' }));
        const data = filtered.map(b => b.total);

        // Update summary stats
        const now = new Date();
        const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

        const thisMonthTotal = byMonth.get(thisMonthKey)?.total || 0;
        const lastMonthTotal = byMonth.get(lastMonthKey)?.total || 0;
        const bestMonth = sorted.length > 0 ? Math.max(...sorted.map(b => b.total)) : 0;

        const fmt = (v) => formatCurrency(v, symbol);
        this.updateElement('revenueThisMonth', fmt(thisMonthTotal));
        this.updateElement('revenueLastMonth', fmt(lastMonthTotal));
        this.updateElement('revenueBestMonth', fmt(bestMonth));

        destroyChart(this.charts.get('revenueSmall'));
        this.charts.set('revenueSmall', new Chart(ctx, {
            type: 'line',
            data: { labels, datasets: [{
                label: 'Revenue',
                data,
                borderColor: '#22c55e',
                backgroundColor: 'transparent',
                fill: false,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#22c55e',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 6,
                borderWidth: 2.5,
            }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 600, easing: 'easeOutQuart' },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: colors.tooltipBg,
                        titleColor: colors.tooltipTitle,
                        bodyColor: colors.tooltipBody,
                        borderColor: colors.tooltipBorder,
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: { label: ctx => ` ${symbol}${ctx.parsed.y.toFixed(2)}` }
                    }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { color: colors.textColor, maxRotation: 0, font: { size: 11 } } },
                    y: { beginAtZero: true, grid: { color: colors.gridColor }, ticks: { callback: v => symbol + v, color: colors.textColor, maxTicksLimit: 5, font: { size: 10 } } }
                }
            }
        }));
    }

    /**
     * Status breakdown doughnut chart
     */
    renderStatusSmallChart(invoices) {
        const ctx = document.getElementById('statusChartSmall');
        if (!ctx) return;

        const statusCounts = invoices.reduce((counts, inv) => {
            const status = this.app.storage
                ? this.app.storage.getInvoiceStatus(inv)
                : (inv.status || 'draft');
            counts[status] = (counts[status] || 0) + 1;
            return counts;
        }, {});

        const labels = Object.keys(statusCounts);
        const data = Object.values(statusCounts);
        const colors = labels.map(l => STATUS_COLORS[l] || '#6b7280');

        destroyChart(this.charts.get('statusSmall'));
        this.charts.set('statusSmall', new Chart(ctx, {
            type: 'doughnut',
            data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10, usePointStyle: true } },
                    tooltip: {
                        backgroundColor: getThemeColors().tooltipBg,
                        titleColor: getThemeColors().tooltipTitle,
                        bodyColor: getThemeColors().tooltipBody,
                        padding: 12,
                        callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed} invoices` }
                    }
                }
            }
        }));
    }

    /**
     * Paid vs Outstanding line chart
     */
    renderRevenueCostsChart(invoices, symbol) {
        const ctx = document.getElementById('revenueCostsChart');
        if (!ctx) return;

        const colors = getThemeColors();
        const locale = getLocale();

        const byDate = new Map();
        for (const inv of invoices) {
            const date = new Date(inv.invoiceDate || inv.createdAt || Date.now());
            const key = date.toDateString();
            if (!byDate.has(key)) byDate.set(key, { date, paid: 0, outstanding: 0 });
            const bucket = byDate.get(key);
            const status = this.app.storage ? this.app.storage.getInvoiceStatus(inv) : (inv.status || 'draft');
            const amount = inv.total || 0;
            if (status === 'Paid') bucket.paid += amount;
            else if (status !== 'Draft') bucket.outstanding += amount;
        }

        const sorted = [...byDate.values()].sort((a, b) => a.date - b.date);
        const labels = sorted.map(b => b.date.toLocaleDateString(locale, { month: 'short', day: 'numeric' }));
        const paidData = sorted.map(b => b.paid);
        const outstandingData = sorted.map(b => b.outstanding);

        destroyChart(this.charts.get('revenueCosts'));
        this.charts.set('revenueCosts', new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Paid',
                        data: paidData,
                        borderColor: '#5e6ad2',
                        backgroundColor: 'transparent',
                        fill: false,
                        tension: 0.4,
                        pointRadius: 2,
                        pointHoverRadius: 5,
                    },
                    {
                        label: 'Outstanding',
                        data: outstandingData,
                        borderColor: '#f59e0b',
                        backgroundColor: 'transparent',
                        fill: false,
                        tension: 0.4,
                        pointRadius: 2,
                        pointHoverRadius: 5,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10 } },
                    tooltip: {
                        backgroundColor: colors.tooltipBg,
                        titleColor: colors.tooltipTitle,
                        bodyColor: colors.tooltipBody,
                        borderColor: colors.tooltipBorder,
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: { label: ctx => ` ${ctx.dataset.label}: ${symbol}${ctx.parsed.y.toFixed(2)}` }
                    }
                },
                scales: {
                    x: { ticks: { maxTicksLimit: 6, maxRotation: 0, color: colors.textColor }, grid: { color: colors.gridColor } },
                    y: { beginAtZero: true, ticks: { callback: v => symbol + v, color: colors.textColor }, grid: { color: colors.gridColor } }
                }
            }
        }));
    }

    /**
     * Per-client income bar chart
     */
    renderPerClientIncomeChart(invoices, symbol) {
        const ctx = document.getElementById('perClientIncomeChart');
        const emptyEl = document.getElementById('perClientIncomeEmpty');
        if (!ctx) return;

        const clientTotals = invoices.reduce((sums, inv) => {
            const name = inv.clientName || 'Unknown';
            sums[name] = (sums[name] || 0) + (inv.total || 0);
            return sums;
        }, {});

        const sorted = Object.entries(clientTotals).sort((a, b) => b[1] - a[1]);

        if (sorted.length === 0) {
            if (ctx) ctx.style.display = 'none';
            if (emptyEl) emptyEl.style.display = 'block';
            return;
        }
        if (emptyEl) emptyEl.style.display = 'none';
        if (ctx) ctx.style.display = '';

        const labels = sorted.map(([name]) => name);
        const data = sorted.map(([, total]) => total);
        const bgColors = labels.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]);
        const isHorizontal = labels.length > 6;

        destroyChart(this.charts.get('perClientIncome'));
        this.charts.set('perClientIncome', new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Income',
                    data,
                    backgroundColor: bgColors,
                    borderColor: bgColors,
                    borderWidth: 1,
                    borderRadius: 6,
                    maxBarThickness: 48,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: isHorizontal ? 'y' : 'x',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.85)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: (ctx) => {
                                const value = isHorizontal ? ctx.parsed.x : ctx.parsed.y;
                                return symbol + value.toFixed(2);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: isHorizontal, color: getThemeColors().gridColor },
                        ticks: { color: getThemeColors().textColor, maxRotation: 45, minRotation: 0 }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: getThemeColors().gridColor },
                        ticks: { color: getThemeColors().textColor, callback: (v) => symbol + v }
                    }
                }
            }
        }));
    }

    /**
     * Key insights revenue trend chart
     */
    renderKeyInsightsChart(invoices, symbol) {
        const ctx = document.getElementById('dashRevenueChartCanvas');
        if (!ctx) return;

        const colors = getThemeColors();
        const locale = getLocale();

        const byDate = new Map();
        for (const inv of invoices) {
            const date = new Date(inv.invoiceDate || inv.createdAt || Date.now());
            const key = date.toDateString();
            if (!byDate.has(key)) byDate.set(key, { date, total: 0 });
            byDate.get(key).total += (inv.total || 0);
        }

        const sorted = [...byDate.values()].sort((a, b) => a.date - b.date);
        if (sorted.length === 1) {
            const prev = new Date(sorted[0].date);
            prev.setDate(prev.getDate() - 1);
            sorted.unshift({ date: prev, total: 0 });
        }

        const labels = sorted.map(b => b.date.toLocaleDateString(locale, { month: 'short', day: 'numeric' }));
        const data = sorted.map(b => b.total);

        destroyChart(this.charts.get('keyInsights'));
        this.charts.set('keyInsights', new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Revenue',
                    data,
                    borderColor: '#22c55e',
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: colors.tooltipBg,
                        titleColor: colors.tooltipTitle,
                        bodyColor: colors.tooltipBody,
                        borderColor: colors.tooltipBorder,
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: { label: ctx => ` ${symbol}${ctx.parsed.y.toFixed(2)}` }
                    }
                },
                scales: {
                    x: { display: true, grid: { display: false }, ticks: { color: colors.textColor, maxTicksLimit: 5, font: { size: 10 } } },
                    y: { display: true, beginAtZero: true, grid: { color: colors.gridColor }, ticks: { callback: v => symbol + v, color: colors.textColor, maxTicksLimit: 4, font: { size: 10 } } }
                },
                layout: { padding: 0 }
            }
        }));
    }

    /**
     * Projected earnings chart (actual vs projected)
     */
    renderProjectedEarningsChart(invoices, symbol) {
        const ctx = document.getElementById('projectedEarningsChart');
        if (!ctx) return;

        const colors = getThemeColors();
        const locale = getLocale();

        const byMonth = new Map();
        for (const inv of invoices) {
            const d = new Date(inv.invoiceDate || inv.createdAt || Date.now());
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const status = this.app.storage ? this.app.storage.getInvoiceStatus(inv) : (inv.status || 'draft');
            if (!byMonth.has(key)) byMonth.set(key, { date: new Date(d.getFullYear(), d.getMonth(), 1), paid: 0, pending: 0 });
            const bucket = byMonth.get(key);
            if (status === 'Paid') bucket.paid += (inv.total || 0);
            else if (status !== 'Draft') bucket.pending += (inv.total || 0);
        }

        const sorted = [...byMonth.values()].sort((a, b) => a.date - b.date);
        const labels = sorted.map(b => b.date.toLocaleDateString(locale, { month: 'short', year: '2-digit' }));
        const paidData = sorted.map(b => b.paid);
        const projectedData = sorted.map(b => b.paid + b.pending);

        destroyChart(this.charts.get('projectedEarnings'));
        this.charts.set('projectedEarnings', new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Actual Revenue (Paid)',
                        data: paidData,
                        borderColor: '#22c55e',
                        backgroundColor: 'transparent',
                        fill: false,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#22c55e',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointHoverRadius: 6,
                        borderWidth: 2.5
                    },
                    {
                        label: 'Projected Revenue (Paid + Pending)',
                        data: projectedData,
                        borderColor: '#5e6ad2',
                        backgroundColor: 'transparent',
                        fill: false,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#5e6ad2',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointHoverRadius: 6,
                        borderWidth: 2.5,
                        borderDash: [5, 5]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 600, easing: 'easeOutQuart' },
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10 } },
                    tooltip: {
                        backgroundColor: colors.tooltipBg,
                        titleColor: colors.tooltipTitle,
                        bodyColor: colors.tooltipBody,
                        borderColor: colors.tooltipBorder,
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: { label: ctx => ` ${ctx.dataset.label}: ${symbol}${ctx.parsed.y.toFixed(2)}` }
                    }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { color: colors.textColor, maxRotation: 0, font: { size: 11 } } },
                    y: { beginAtZero: true, grid: { color: colors.gridColor }, ticks: { callback: v => symbol + v, color: colors.textColor, maxTicksLimit: 5, font: { size: 10 } } }
                }
            }
        }));
    }

    /**
     * A/R Aging bar chart
     */
    renderARAgingChart(invoices, symbol) {
        const ctx = document.getElementById('arAgingChart');
        if (!ctx) return;

        const colors = getThemeColors();

        // Filter to unpaid/sent invoices
        const overdueAndPending = invoices.filter(inv => {
            const s = (inv.status || 'draft').toLowerCase();
            return s === 'overdue' || s === 'sent' || s === 'pending';
        });

        const now = new Date();
        const buckets = { 'Current': 0, '1-30 Days': 0, '31-60 Days': 0, '61-90 Days': 0, '90+ Days': 0 };

        overdueAndPending.forEach(inv => {
            const due = new Date(inv.dueDate || inv.invoiceDate || inv.createdAt);
            const days = Math.floor((now - due) / (1000 * 60 * 60 * 24));
            const val = inv.total || 0;

            if (days <= 0) buckets['Current'] += val;
            else if (days <= 30) buckets['1-30 Days'] += val;
            else if (days <= 60) buckets['31-60 Days'] += val;
            else if (days <= 90) buckets['61-90 Days'] += val;
            else buckets['90+ Days'] += val;
        });

        const labels = Object.keys(buckets);
        const data = Object.values(buckets);
        const bucketColors = ['#22c55e', '#f59e0b', '#f97316', '#ef4444', '#7f1d1d'];

        destroyChart(this.charts.get('arAging'));
        this.charts.set('arAging', new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'A/R Aging',
                    data,
                    backgroundColor: bucketColors,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: colors.tooltipBg,
                        titleColor: colors.tooltipTitle,
                        bodyColor: colors.tooltipBody,
                        borderColor: colors.tooltipBorder,
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: { label: ctx => ` ${symbol}${ctx.parsed.y.toFixed(2)}` }
                    }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { color: colors.textColor, font: { size: 11 } } },
                    y: { grid: { color: colors.gridColor }, ticks: { callback: v => symbol + v, color: colors.textColor, font: { size: 10 } }, beginAtZero: true }
                }
            }
        }));
    }

    /**
     * Top clients list
     */
    renderTopClients(invoices, symbol) {
        const el = document.getElementById('dashTopClients');
        if (!el) return;

        const clientTotals = invoices.reduce((sums, inv) => {
            const name = inv.clientName || 'Unknown';
            sums[name] = (sums[name] || 0) + (inv.total || 0);
            return sums;
        }, {});

        const sorted = Object.entries(clientTotals).sort((a, b) => b[1] - a[1]).slice(0, 5);

        if (sorted.length === 0) {
            el.innerHTML = '<p class="text-muted" style="padding:1rem;text-align:center;">No client data yet</p>';
            return;
        }

        const safeSymbol = escapeHtml(symbol);
        el.innerHTML = sorted.map(([name, total]) => `
            <div class="campaign-item">
                <div class="camp-info" style="flex:1;">
                    <h4>${escapeHtml(name)}</h4>
                    <p class="text-muted text-sm">${safeSymbol}${escapeHtml(total.toFixed(2))}</p>
                </div>
            </div>
        `).join('');
    }

    /**
     * Clean up all charts
     */
    destroy() {
        for (const chart of this.charts.values()) {
            destroyChart(chart);
        }
        this.charts.clear();

        const container = document.getElementById('revenueChartFilters');
        if (container && this._filterHandler) {
            container.removeEventListener('click', this._filterHandler);
        }
    }
}

/**
 * Factory function to create dashboard instance
 */
export function createDashboard(appContext) {
    return new Dashboard(appContext);
}

/**
 * Legacy compatibility - keep the old function signatures
 */
export async function renderDashboard() {
    const dashboard = new Dashboard(this);
    await dashboard.render();
}

// Export individual chart functions for backward compatibility
export function renderRevenueSmallChart(invoices, symbol) {
    const dashboard = new Dashboard({ storage: this.storage });
    dashboard.cachedInvoices = invoices;
    dashboard.cachedSymbol = symbol;
    dashboard.filterRange = '6m';
    dashboard.renderRevenueSmallChart(invoices, symbol);
}

export function renderStatusSmallChart(invoices) {
    const dashboard = new Dashboard({ storage: this.storage });
    dashboard.renderStatusSmallChart(invoices);
}

export function renderRevenueCostsChart(invoices, symbol) {
    const dashboard = new Dashboard({ storage: this.storage });
    dashboard.renderRevenueCostsChart(invoices, symbol);
}

export function renderPerClientIncomeChart(invoices) {
    const symbol = invoices.length ? getSymbol(invoices[0]) : '$';
    const dashboard = new Dashboard({ storage: this.storage });
    dashboard.renderPerClientIncomeChart(invoices, symbol);
}

export function renderKeyInsightsChart(invoices, symbol) {
    const dashboard = new Dashboard({ storage: this.storage });
    dashboard.renderKeyInsightsChart(invoices, symbol);
}

export function renderProjectedEarningsChart(invoices, symbol) {
    const dashboard = new Dashboard({ storage: this.storage });
    dashboard.renderProjectedEarningsChart(invoices, symbol);
}

export function renderARAgingChart(invoices, symbol) {
    const dashboard = new Dashboard({ storage: this.storage });
    dashboard.renderARAgingChart(invoices, symbol);
}

export function renderTopClients(invoices, symbol) {
    const dashboard = new Dashboard({ storage: this.storage });
    dashboard.renderTopClients(invoices, symbol);
}

export function initRevenueFilters() {
    // No-op - handled by Dashboard class now
}