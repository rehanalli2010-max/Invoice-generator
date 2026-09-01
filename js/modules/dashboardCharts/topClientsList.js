/**
 * Top Clients List
 * Renders HTML list of top clients by revenue (not a Chart.js chart)
 */

import { escapeHtml } from '../../utils.js';
import { getChartThemeColors } from '../themeColors.js';

export function renderTopClients(container, invoices, symbol, maxClients = 5) {
  const el = typeof container === 'string' ? document.getElementById(container) : container;
  if (!el) return;

  const clientTotals = invoices.reduce((sums, inv) => {
    const name = inv.clientName || 'Unknown';
    sums[name] = (sums[name] || 0) + (inv.total || 0);
    return sums;
  }, {});

  const sorted = Object.entries(clientTotals).sort((a, b) => b[1] - a[1]).slice(0, maxClients);

  if (sorted.length === 0) {
    el.innerHTML = '<p class="text-muted" style="padding:1rem;text-align:center;">No client data yet</p>';
    return;
  }

  const colors = getChartThemeColors();
  const safeSymbol = escapeHtml(symbol);
  const maxAmount = sorted[0][1];

  el.innerHTML = sorted.map(([name, total], index) => {
    const pct = maxAmount > 0 ? Math.min(Number((total / maxAmount * 100).toFixed(1)), 100) : 0;
    const paletteColor = getPaletteColor(index);
    return `
      <div class="client-row" style="margin-bottom: 0.75rem;">
        <div style="flex:1; min-width: 0;">
          <div class="client-name" style="margin-bottom: 0.25rem;">${escapeHtml(name)}</div>
          <div class="client-bar" style="height: 4px; background: var(--bg-secondary); border-radius: 2px; overflow: hidden;">
            <div class="client-bar-fill" style="width:${pct}%; height: 100%; background: ${paletteColor}; border-radius: 2px; transition: width 0.6s ease-out;"></div>
          </div>
        </div>
        <div class="client-amount" style="font-weight: 700; color: var(--accent); font-variant-numeric: tabular-nums; white-space: nowrap; margin-left: 1rem;">
          ${safeSymbol}${escapeHtml(total.toFixed(2))}
        </div>
      </div>
    `;
  }).join('');
}

function getPaletteColor(index) {
  const palette = [
    '#5e6ad2', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
  ];
  return palette[index % palette.length];
}