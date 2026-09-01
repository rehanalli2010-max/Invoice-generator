/**
 * Dashboard Analytics Module
 * Theme-aware, modular implementation using Chart.js
 */

import Invoice from '../invoice.js';
import { escapeHtml } from '../utils.js';
import { loadChartJs } from './chartDefaults.js';
import { getChartThemeColors } from './themeColors.js';
import { renderRevenueChart } from './dashboardCharts/revenueChart.js';
import { renderStatusChart } from './dashboardCharts/statusChart.js';
import { renderRevenueCostsChart } from './dashboardCharts/revenueCostsChart.js';
import { renderPerClientChart } from './dashboardCharts/perClientChart.js';
import { renderKeyInsightsChart } from './dashboardCharts/keyInsightsChart.js';
import { renderProjectedChart } from './dashboardCharts/projectedChart.js';
import { renderARAgingChart } from './dashboardCharts/arAgingChart.js';
import { renderTopClients } from './dashboardCharts/topClientsList.js';
import { destroyChart } from './chartDefaults.js';

const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '€', GBP: '£', CAD: 'C$', AUD: 'A$', INR: '₹', JPY: '¥',
  PKR: 'Rs', BDT: '৳', LKR: 'Rs', NPR: 'Rs', AED: 'AED', SAR: 'SAR',
  CNY: '¥', KRW: '₩', SGD: 'S$', MYR: 'RM', IDR: 'Rp', THB: '฿',
  NGN: '₦', ZAR: 'R', KES: 'KSh', BRL: 'R$', MXN: 'MX$',
};

function formatNumber(num, decimals = 2) {
  return Number(num || 0).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatCurrency(amount, symbol, decimals = 2) {
  return `${symbol}${formatNumber(amount, decimals)}`;
}

function getSymbol(invoice) {
  if (!invoice) return '$';
  return CURRENCY_SYMBOLS[invoice.currency] || invoice.currency || '$';
}

export class Dashboard {
  constructor(appContext) {
    this.app = appContext;
    this.charts = new Map();
    this.filterRange = '6m';
    this.cachedInvoices = null;
    this.cachedSymbol = '$';
    this._themeObserver = null;
  }

  async render() {
    this.filterRange = '6m';

    const invoices = this.app.token
      ? await this.app.apiGetInvoices()
      : this.app.storage.getInvoices();

    this.cachedInvoices = invoices;
    this.cachedSymbol = invoices.length > 0 ? getSymbol(invoices[0]) : '$';

    this.renderStatCards(invoices);
    this.initFilterButtons();

    if (await loadChartJs()) {
      this.renderAllCharts(invoices, this.cachedSymbol);
    }

    this.renderTopClients(invoices, this.cachedSymbol);
    this.observeThemeChanges();
  }

  observeThemeChanges() {
    if (this._themeObserver) this._themeObserver.disconnect();
    this._themeObserver = new MutationObserver(() => this.onThemeChange());
    this._themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });
  }

  onThemeChange() {
    if (this.cachedInvoices) {
      this.renderAllCharts(this.cachedInvoices, this.cachedSymbol);
      this.renderTopClients(this.cachedInvoices, this.cachedSymbol);
    }
  }

  renderStatCards(invoices) {
    const total = invoices.length;
    const totals = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const average = total > 0 ? totals / total : 0;

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

    this.updateElement('dashTotalRevenue', formatCurrency(totals, symbol));
    this.updateElement('dashTotalInvoices', total.toString());
    this.updateElement('dashAverageInvoice', formatCurrency(average, symbol));
    this.updateElement('dashPendingCount',
      (statusCounts['Pending'] || 0) + (statusCounts['Sent'] || 0) + (statusCounts['Due Today'] || 0));
    this.updateElement('dashOverdueCount', statusCounts['Overdue'] || 0);
    this.updateElement('dashRecurringCount', recurringCount);

    this.updateElement('dashRevenue', formatCurrency(totals, symbol));
    this.updateElement('dashRevenueGrowth', `${total} invoices`);
  }

  updateElement(id, content) {
    const el = document.getElementById(id);
    if (el) el.textContent = content;
  }

  initFilterButtons() {
    const container = document.getElementById('revenueChartFilters');
    if (!container) return;

    container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.range === '6m');
    });

    container.removeEventListener('click', this._filterHandler);
    this._filterHandler = (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;

      container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.filterRange = btn.dataset.range;

      if (this.cachedInvoices) {
        this.renderRevenueChart(this.cachedInvoices, this.cachedSymbol);
      }
    };
    container.addEventListener('click', this._filterHandler);
  }

  renderAllCharts(invoices, symbol) {
    this.renderRevenueChart(invoices, symbol);
    this.renderStatusChart(invoices);
    this.renderRevenueCostsChart(invoices, symbol);
    this.renderPerClientChart(invoices, symbol);
    this.renderKeyInsightsChart(invoices, symbol);
    this.renderProjectedChart(invoices, symbol);
    this.renderARAgingChart(invoices, symbol);
  }

  renderRevenueChart(invoices, symbol) {
    const ctx = document.getElementById('revenueChartSmall');
    if (!ctx) return;

    destroyChart(this.charts.get('revenueSmall'));
    this.charts.set('revenueSmall', renderRevenueChart(ctx, invoices, symbol, this.filterRange));
  }

  renderStatusChart(invoices) {
    const ctx = document.getElementById('statusChartSmall');
    if (!ctx) return;

    const getInvoiceStatus = this.app.storage?.getInvoiceStatus.bind(this.app.storage);
    destroyChart(this.charts.get('statusSmall'));
    this.charts.set('statusSmall', renderStatusChart(ctx, invoices, getInvoiceStatus));
  }

  renderRevenueCostsChart(invoices, symbol) {
    const ctx = document.getElementById('revenueCostsChart');
    if (!ctx) return;

    const getInvoiceStatus = this.app.storage?.getInvoiceStatus.bind(this.app.storage);
    destroyChart(this.charts.get('revenueCosts'));
    this.charts.set('revenueCosts', renderRevenueCostsChart(ctx, invoices, symbol, getInvoiceStatus));
  }

  renderPerClientChart(invoices, symbol) {
    const ctx = document.getElementById('perClientIncomeChart');
    if (!ctx) return;

    destroyChart(this.charts.get('perClientIncome'));
    this.charts.set('perClientIncome', renderPerClientChart(ctx, invoices, symbol));
  }

  renderKeyInsightsChart(invoices, symbol) {
    const ctx = document.getElementById('dashRevenueChartCanvas');
    if (!ctx) return;

    destroyChart(this.charts.get('keyInsights'));
    this.charts.set('keyInsights', renderKeyInsightsChart(ctx, invoices, symbol));
  }

  renderProjectedChart(invoices, symbol) {
    const ctx = document.getElementById('projectedEarningsChart');
    if (!ctx) return;

    const getInvoiceStatus = this.app.storage?.getInvoiceStatus.bind(this.app.storage);
    destroyChart(this.charts.get('projectedEarnings'));
    this.charts.set('projectedEarnings', renderProjectedChart(ctx, invoices, symbol, getInvoiceStatus));
  }

  renderARAgingChart(invoices, symbol) {
    const ctx = document.getElementById('arAgingChart');
    if (!ctx) return;

    const getInvoiceStatus = this.app.storage?.getInvoiceStatus.bind(this.app.storage);
    destroyChart(this.charts.get('arAging'));
    this.charts.set('arAging', renderARAgingChart(ctx, invoices, symbol, getInvoiceStatus));
  }

  renderTopClients(invoices, symbol) {
    renderTopClients('dashTopClients', invoices, symbol, 5);
  }

  destroy() {
    if (this._themeObserver) {
      this._themeObserver.disconnect();
      this._themeObserver = null;
    }

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

export function createDashboard(appContext) {
  return new Dashboard(appContext);
}

export async function renderDashboard(appContext) {
  if (appContext.dashboard) {
    appContext.dashboard.destroy();
  }
  appContext.dashboard = new Dashboard(appContext);
  await appContext.dashboard.render();
  return appContext.dashboard;
}

export function renderRevenueSmallChart(appContext, invoices, symbol) {
  const dashboard = appContext.dashboard || new Dashboard(appContext);
  dashboard.cachedInvoices = invoices;
  dashboard.cachedSymbol = symbol;
  dashboard.filterRange = '6m';
  dashboard.renderRevenueChart(invoices, symbol);
}

export function renderStatusSmallChart(appContext, invoices) {
  const dashboard = appContext.dashboard || new Dashboard(appContext);
  dashboard.renderStatusChart(invoices);
}

export function renderRevenueCostsChartWrapper(appContext, invoices, symbol) {
  const dashboard = appContext.dashboard || new Dashboard(appContext);
  dashboard.renderRevenueCostsChart(invoices, symbol);
}

export function renderPerClientIncomeChart(appContext, invoices) {
  const symbol = invoices.length ? getSymbol(invoices[0]) : '$';
  const dashboard = appContext.dashboard || new Dashboard(appContext);
  dashboard.renderPerClientChart(invoices, symbol);
}

export function renderKeyInsightsChartWrapper(appContext, invoices, symbol) {
  const dashboard = appContext.dashboard || new Dashboard(appContext);
  dashboard.renderKeyInsightsChart(invoices, symbol);
}

export function renderProjectedEarningsChart(appContext, invoices, symbol) {
  const dashboard = appContext.dashboard || new Dashboard(appContext);
  dashboard.renderProjectedChart(invoices, symbol);
}

export function renderARAgingChartWrapper(appContext, invoices, symbol) {
  const dashboard = appContext.dashboard || new Dashboard(appContext);
  dashboard.renderARAgingChart(invoices, symbol);
}

export function renderTopClientsWrapper(appContext, invoices, symbol) {
  const dashboard = appContext.dashboard || new Dashboard(appContext);
  dashboard.renderTopClients(invoices, symbol);
}

export function initRevenueFilters() {
}