/**
 * Key Insights Mini Revenue Chart
 * Small sparkline-style chart in the key insights card
 */

import { getChartThemeColors, getFillGradient, getGradient } from '../themeColors.js';
import { getMiniChartOptions, destroyChart } from '../chartDefaults.js';

export function renderKeyInsightsChart(ctx, invoices, symbol) {
  const colors = getChartThemeColors();
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

  const gradientFill = (ctx) => getFillGradient(ctx.chart?.ctx, ctx.chart?.chartArea, 0.25, 0.02);
  const gradientStroke = (ctx) => getGradient(ctx.chart?.ctx, ctx.chart?.chartArea, 'horizontal');

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Revenue',
        data,
        borderColor: gradientStroke,
        backgroundColor: gradientFill,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointBackgroundColor: colors.primary,
        pointBorderColor: colors.bgCard,
        pointBorderWidth: 2,
        borderWidth: 2,
      }],
    },
    options: getMiniChartOptions(symbol, {
      plugins: {
        tooltip: {
          callbacks: { label: (ctx) => ` ${symbol}${ctx.parsed.y.toFixed(2)}` },
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