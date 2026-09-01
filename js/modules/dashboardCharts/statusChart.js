/**
 * Status Breakdown Doughnut Chart
 * Shows invoice status distribution
 */

import { getChartThemeColors, getStatusColors } from '../themeColors.js';
import { getDoughnutChartOptions, destroyChart } from '../chartDefaults.js';

export function renderStatusChart(ctx, invoices, getInvoiceStatus) {
  const colors = getChartThemeColors();

  const statusCounts = invoices.reduce((counts, inv) => {
    const status = getInvoiceStatus ? getInvoiceStatus(inv) : (inv.status || 'draft');
    const label = status.charAt(0).toUpperCase() + status.slice(1);
    counts[label] = (counts[label] || 0) + 1;
    return counts;
  }, {});

  const labels = Object.keys(statusCounts);
  const data = Object.values(statusCounts);
  const bgColors = getStatusColors(labels);

  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
      datasets: [{
        data,
        backgroundColor: bgColors,
        borderWidth: 0,
        hoverOffset: 8,
      }],
    },
    options: getDoughnutChartOptions({
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.parsed} invoices`,
          },
        },
      },
    }),
  });
}