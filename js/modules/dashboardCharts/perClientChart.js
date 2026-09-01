/**
 * Per-Client Income Bar Chart
 * Shows income by client (horizontal bar for many clients)
 */

import { getChartThemeColors, getPaletteColor } from '../themeColors.js';
import { getBarChartOptions, destroyChart } from '../chartDefaults.js';

export function renderPerClientChart(ctx, invoices, symbol, emptyElId = 'perClientIncomeEmpty') {
  const colors = getChartThemeColors();
  const emptyEl = document.getElementById(emptyElId);

  const clientTotals = invoices.reduce((sums, inv) => {
    const name = inv.clientName || 'Unknown';
    sums[name] = (sums[name] || 0) + (inv.total || 0);
    return sums;
  }, {});

  const sorted = Object.entries(clientTotals).sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    if (ctx) ctx.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'block';
    return null;
  }
  if (emptyEl) emptyEl.style.display = 'none';
  if (ctx) ctx.style.display = '';

  const labels = sorted.map(([name]) => name);
  const data = sorted.map(([, total]) => total);
  const bgColors = labels.map((_, i) => getPaletteColor(i));
  const isHorizontal = labels.length > 6;

  return new Chart(ctx, {
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
      }],
    },
    options: getBarChartOptions(symbol, isHorizontal, {
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const value = isHorizontal ? ctx.parsed.x : ctx.parsed.y;
              return `${symbol}${value.toFixed(2)}`;
            },
          },
        },
      },
    }),
  });
}