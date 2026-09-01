/**
 * Chart.js Default Configuration
 * Theme-aware shared configuration for all dashboard charts
 */

import { getChartThemeColors } from './themeColors.js';

let _chartJsLoadPromise = null;

export async function loadChartJs() {
  if (typeof Chart !== 'undefined') return true;

  if (!_chartJsLoadPromise) {
    _chartJsLoadPromise = (async () => {
      try {
        const module = await import('https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js');
        window.Chart = module.Chart || module.default || module;
        return true;
      } catch (e) {
        window.Chart = null;
        _chartJsLoadPromise = null;
        throw e;
      }
    })();
  }

  try {
    await _chartJsLoadPromise;
    return true;
  } catch (e) {
    return false;
  }
}

export function getDefaultChartOptions(overrides = {}) {
  const colors = getChartThemeColors();
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: 'easeOutQuart' },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: false,
        position: 'bottom',
        labels: {
          color: colors.textMuted,
          font: { size: 11, family: "'Space Grotesk', sans-serif" },
          boxWidth: 12,
          padding: 12,
          usePointStyle: true,
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: colors.tooltipBg,
        titleColor: colors.tooltipTitle,
        bodyColor: colors.tooltipBody,
        borderColor: colors.tooltipBorder,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        titleFont: { size: 12, weight: '600', family: "'Space Grotesk', sans-serif" },
        bodyFont: { size: 11, family: "'Space Grotesk', sans-serif" },
        ...overrides.tooltip,
      },
    },
    scales: {
      x: {
        grid: {
          color: colors.gridColor,
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: colors.textMuted,
          maxRotation: 0,
          font: { size: 10, family: "'Space Grotesk', sans-serif" },
          padding: 8,
        },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: colors.gridColor,
          drawBorder: false,
          lineWidth: 1,
        },
        ticks: {
          color: colors.textMuted,
          font: { size: 10, family: "'Space Grotesk', sans-serif" },
          padding: 8,
          maxTicksLimit: 5,
          callback: (v) => v,
        },
        border: { display: false },
      },
    },
    layout: {
      padding: { top: 8, right: 8, bottom: 0, left: 0 },
    },
    ...overrides,
  };
}

export function getLineChartOptions(symbol, overrides = {}) {
  const colors = getChartThemeColors();
  return getDefaultChartOptions({
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${symbol}${ctx.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      y: {
        ticks: { callback: (v) => symbol + v },
      },
    },
    ...overrides,
  });
}

export function getBarChartOptions(symbol, isHorizontal = false, overrides = {}) {
  const colors = getChartThemeColors();
  return getDefaultChartOptions({
    indexAxis: isHorizontal ? 'y' : 'x',
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const value = isHorizontal ? ctx.parsed.x : ctx.parsed.y;
            return ` ${symbol}${value.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      [isHorizontal ? 'x' : 'y']: {
        beginAtZero: true,
        ticks: { callback: (v) => symbol + v },
      },
      [isHorizontal ? 'y' : 'x']: {
        grid: { display: isHorizontal, color: colors.gridColor },
      },
    },
    ...overrides,
  });
}

export function getDoughnutChartOptions(overrides = {}) {
  const colors = getChartThemeColors();
  return getDefaultChartOptions({
    cutout: '60%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: colors.textMuted,
          font: { size: 11, family: "'Space Grotesk', sans-serif" },
          boxWidth: 12,
          padding: 16,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label}: ${ctx.parsed} invoices`,
        },
      },
    },
    ...overrides,
  });
}

export function getMiniChartOptions(symbol, overrides = {}) {
  const colors = getChartThemeColors();
  return getDefaultChartOptions({
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        callbacks: { label: (ctx) => ` ${symbol}${ctx.parsed.y.toFixed(2)}` },
      },
    },
    scales: {
      x: {
        display: true,
        grid: { display: false },
        ticks: { color: colors.textMuted, maxTicksLimit: 5, font: { size: 10 } },
      },
      y: {
        display: true,
        beginAtZero: true,
        grid: { color: colors.gridColor },
        ticks: { callback: (v) => symbol + v, color: colors.textMuted, maxTicksLimit: 4, font: { size: 10 } },
      },
    },
    layout: { padding: 0 },
    ...overrides,
  });
}

export function destroyChart(chartRef) {
  if (chartRef && typeof chartRef.destroy === 'function') {
    chartRef.destroy();
  }
}