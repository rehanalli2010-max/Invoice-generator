/**
 * Projected Earnings Chart
 * Shows actual (paid) vs projected (paid + pending) revenue over time
 */

import { getChartThemeColors, getGradient } from '../themeColors.js';
import { getLineChartOptions, destroyChart } from '../chartDefaults.js';

export function renderProjectedChart(ctx, invoices, symbol, getInvoiceStatus) {
  const colors = getChartThemeColors();
  const locale = getLocale();

  const byMonth = new Map();
  for (const inv of invoices) {
    const d = new Date(inv.invoiceDate || inv.createdAt || Date.now());
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const status = getInvoiceStatus ? getInvoiceStatus(inv) : (inv.status || 'draft');
    if (!byMonth.has(key)) byMonth.set(key, { date: new Date(d.getFullYear(), d.getMonth(), 1), paid: 0, pending: 0 });
    const bucket = byMonth.get(key);
    if (status === 'Paid') bucket.paid += (inv.total || 0);
    else if (status !== 'Draft') bucket.pending += (inv.total || 0);
  }

  const sorted = [...byMonth.values()].sort((a, b) => a.date - b.date);
  const labels = sorted.map(b => b.date.toLocaleDateString(locale, { month: 'short', year: '2-digit' }));
  const paidData = sorted.map(b => b.paid);
  const projectedData = sorted.map(b => b.paid + b.pending);

  const actualGradient = (ctx) => {
    const chart = ctx.chart;
    if (!chart?.chartArea) return colors.success;
    const g = chart.ctx.createLinearGradient(chart.chartArea.left, 0, chart.chartArea.right, 0);
    g.addColorStop(0, colors.success);
    g.addColorStop(1, colors.textMain);
    return g;
  };

  const projectedGradient = (ctx) => {
    const chart = ctx.chart;
    if (!chart?.chartArea) return colors.primary;
    const g = chart.ctx.createLinearGradient(chart.chartArea.left, 0, chart.chartArea.right, 0);
    g.addColorStop(0, colors.primary);
    g.addColorStop(1, colors.textMain);
    return g;
  };

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Actual Revenue (Paid)',
          data: paidData,
          borderColor: actualGradient,
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: colors.success,
          pointBorderColor: colors.bgCard,
          pointBorderWidth: 2,
          borderWidth: 2.5,
        },
        {
          label: 'Projected Revenue (Paid + Pending)',
          data: projectedData,
          borderColor: projectedGradient,
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: colors.primary,
          pointBorderColor: colors.bgCard,
          pointBorderWidth: 2,
          borderWidth: 2.5,
          borderDash: [5, 5],
        },
      ],
    },
    options: getLineChartOptions(symbol, {
      plugins: {
        legend: { display: true, position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${symbol}${ctx.parsed.y.toFixed(2)}`,
          },
        },
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