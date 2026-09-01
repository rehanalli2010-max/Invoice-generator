/**
 * Paid vs Outstanding Line Chart
 * Shows paid vs outstanding amounts over time
 */

import { getChartThemeColors, getGradient } from '../themeColors.js';
import { getDefaultChartOptions, destroyChart } from '../chartDefaults.js';

export function renderRevenueCostsChart(ctx, invoices, symbol, getInvoiceStatus) {
  const colors = getChartThemeColors();
  const locale = getLocale();

  const byDate = new Map();
  for (const inv of invoices) {
    const date = new Date(inv.invoiceDate || inv.createdAt || Date.now());
    const key = date.toDateString();
    if (!byDate.has(key)) byDate.set(key, { date, paid: 0, outstanding: 0 });
    const bucket = byDate.get(key);
    const status = getInvoiceStatus ? getInvoiceStatus(inv) : (inv.status || 'draft');
    const amount = inv.total || 0;
    if (status === 'Paid') bucket.paid += amount;
    else if (status !== 'Draft') bucket.outstanding += amount;
  }

  const sorted = [...byDate.values()].sort((a, b) => a.date - b.date);
  const labels = sorted.map(b => b.date.toLocaleDateString(locale, { month: 'short', day: 'numeric' }));
  const paidData = sorted.map(b => b.paid);
  const outstandingData = sorted.map(b => b.outstanding);

  const paidGradient = (ctx) => {
    const chart = ctx.chart;
    if (!chart?.chartArea) return colors.success;
    const g = chart.ctx.createLinearGradient(chart.chartArea.left, 0, chart.chartArea.right, 0);
    g.addColorStop(0, colors.success);
    g.addColorStop(1, colors.textMain);
    return g;
  };

  const outstandingGradient = (ctx) => {
    const chart = ctx.chart;
    if (!chart?.chartArea) return colors.warning;
    const g = chart.ctx.createLinearGradient(chart.chartArea.left, 0, chart.chartArea.right, 0);
    g.addColorStop(0, colors.warning);
    g.addColorStop(1, colors.textMain);
    return g;
  };

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Paid',
          data: paidData,
          borderColor: paidGradient,
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
        {
          label: 'Outstanding',
          data: outstandingData,
          borderColor: outstandingGradient,
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 5,
          borderWidth: 2,
          borderDash: [5, 5],
        },
      ],
    },
    options: getDefaultChartOptions({
      plugins: {
        legend: { display: true, position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${symbol}${ctx.parsed.y.toFixed(2)}`,
          },
        },
      },
      scales: {
        y: { ticks: { callback: (v) => symbol + v } },
      },
    }),
  });
}

function getLocale() {
  if (typeof i18n !== 'undefined' && i18n.locales?.[i18n.currentLocale]?.currencyLocale) {
    return i18n.locales[i18n.currentLocale].currencyLocale;
  }
  return 'en-US';
}