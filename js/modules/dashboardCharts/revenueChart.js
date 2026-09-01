/**
 * Revenue Trend Chart (Small with Filters)
 * Shows monthly revenue over time with 6M/12M/All filters
 */

import { getChartThemeColors, getFillGradient, getGradient, getPaletteColor } from '../themeColors.js';
import { getLineChartOptions, destroyChart } from '../chartDefaults.js';

export function renderRevenueChart(ctx, invoices, symbol, filterRange = '6m') {
  const colors = getChartThemeColors();
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
  if (filterRange === '6m') filtered = sorted.slice(-6);
  else if (filterRange === '12m') filtered = sorted.slice(-12);

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

  const fmt = (v) => `${symbol}${v.toFixed(2)}`;
  updateElement('revenueThisMonth', fmt(thisMonthTotal));
  updateElement('revenueLastMonth', fmt(lastMonthTotal));
  updateElement('revenueBestMonth', fmt(bestMonth));

  const gradientFill = (ctx) => getFillGradient(ctx.chart?.ctx, ctx.chart?.chartArea);
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
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: colors.primary,
        pointBorderColor: colors.bgCard,
        pointBorderWidth: 2,
        borderWidth: 2.5,
      }],
    },
    options: getLineChartOptions(symbol, {
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${symbol}${ctx.parsed.y.toFixed(2)}`,
          },
        },
      },
    }),
  });
}

function updateElement(id, content) {
  const el = document.getElementById(id);
  if (el) el.textContent = content;
}

function getLocale() {
  if (typeof i18n !== 'undefined' && i18n.locales?.[i18n.currentLocale]?.currencyLocale) {
    return i18n.locales[i18n.currentLocale].currencyLocale;
  }
  return 'en-US';
}