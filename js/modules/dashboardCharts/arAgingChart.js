/**
 * A/R Aging Bar Chart
 * Shows outstanding amounts by aging bucket
 */

import { getChartThemeColors } from '../themeColors.js';
import { getBarChartOptions, destroyChart } from '../chartDefaults.js';

export function renderARAgingChart(ctx, invoices, symbol, getInvoiceStatus) {
  const colors = getChartThemeColors();

  // Filter to unpaid/sent invoices
  const overdueAndPending = invoices.filter(inv => {
    const s = (getInvoiceStatus ? getInvoiceStatus(inv) : (inv.status || 'draft')).toLowerCase();
    return s === 'overdue' || s === 'sent' || s === 'pending' || s === 'due today';
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
  const bucketColors = [colors.success, colors.warning, '#f97316', colors.danger, '#7f1d1d'];

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'A/R Aging',
        data,
        backgroundColor: bucketColors,
        borderColor: bucketColors,
        borderWidth: 1,
        borderRadius: 6,
        maxBarThickness: 60,
      }],
    },
    options: getBarChartOptions(symbol, false, {
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (ctx) => ` ${symbol}${ctx.parsed.y.toFixed(2)}` },
        },
      },
    }),
  });
}