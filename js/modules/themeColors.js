/**
 * Theme Colors Bridge
 * Reads CSS custom properties and provides Chart.js-compatible color configs
 * Automatically reacts to theme changes (dark/light + presets)
 */

export function getChartThemeColors() {
  const cs = getComputedStyle(document.documentElement);
  const get = (prop, fallback) => cs.getPropertyValue(prop).trim() || fallback;

  return {
    // Brand colors
    primary: get('--accent', '#5e6ad2'),
    primaryHover: get('--primary-hover', '#1e40af'),
    success: get('--success', '#22c55e'),
    warning: get('--warning', '#f59e0b'),
    danger: get('--danger', '#ef4444'),
    info: get('--accent', '#06b6d4'),

    // Semantic UI colors
    bgCard: get('--bg-card', '#ffffff'),
    bgSecondary: get('--bg-secondary', '#f0f5ff'),
    bgMain: get('--bg-main', '#ffffff'),
    textMain: get('--text-main', '#111827'),
    textMuted: get('--text-muted', '#6b7280'),
    textLight: get('--text-light', '#9ca3af'),
    border: get('--border', '#e5e7eb'),
    borderFocus: get('--border-focus', '#2563eb'),

    // Chart-specific derived colors
    gridColor: get('--border', 'rgba(0,0,0,0.05)'),
    tooltipBg: get('--bg-card', 'rgba(255,255,255,0.95)'),
    tooltipBorder: get('--border', 'rgba(0,0,0,0.08)'),
    tooltipTitle: get('--text-main', '#1e293b'),
    tooltipBody: get('--text-muted', '#475569'),

    // Brand gradient colors (for accent bars)
    brandCyan: get('--brand-cyan', '#22d3ee'),
    brandSky: get('--brand-sky', '#38bdf8'),
    brandViolet: get('--brand-violet', '#0ea5e9'),
  };
}

export function getGradient(ctx, chartArea, direction = 'horizontal') {
  if (!chartArea) return getChartThemeColors().primary;
  const colors = getChartThemeColors();
  const gradient = ctx.createLinearGradient(
    direction === 'horizontal' ? chartArea.left : 0,
    direction === 'vertical' ? chartArea.top : 0,
    direction === 'horizontal' ? chartArea.right : 0,
    direction === 'vertical' ? chartArea.bottom : 0
  );
  gradient.addColorStop(0, colors.primary);
  gradient.addColorStop(1, colors.textMain);
  return gradient;
}

export function getFillGradient(ctx, chartArea, opacityStart = 0.3, opacityEnd = 0.02) {
  if (!chartArea) return getChartThemeColors().primary + '33';
  const colors = getChartThemeColors();
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, hexToRgba(colors.primary, opacityStart));
  gradient.addColorStop(1, hexToRgba(colors.primary, opacityEnd));
  return gradient;
}

export function getStatusColor(status) {
  const colors = getChartThemeColors();
  const map = {
    Paid: colors.success,
    Pending: colors.warning,
    Overdue: colors.danger,
    'Due Today': colors.info,
    Sent: colors.primary,
    Draft: colors.textLight,
  };
  return map[status] || colors.textMuted;
}

export function getStatusColors(statuses) {
  return statuses.map(s => getStatusColor(s));
}

export const CHART_PALETTE = [
  '#5e6ad2', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
];

export function getPaletteColor(index) {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function isDarkTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}