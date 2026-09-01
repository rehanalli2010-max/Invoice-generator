import re

content = '''/**
 * Shared Utility Functions
 * Common utilities used across modules to avoid duplication
 */

/**
 * Escape HTML special characters
 */
export function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const str = String(text);
    const map = {
        '&': '&',
        '<': '<',
        '>': '>',
        '"': '"',
        "'": '&#039;',
        '`': '&#96;'
    };
    return str.replace(/[&<>"'`]/g, m => map[m]);
}

/**
 * Generate a UUID v4 (alias for generateId)
 */
export function generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

// Alias for backward compatibility
export const generateId = generateUUID;

/**
 * Format currency amount with symbol
 */
export function formatCurrency(amount, currency = 'USD') {
    const symbols = {
        'USD': '$',
        'EUR': '\\u20AC',
        'GBP': '\\u00A3',
        'CAD': 'C$',
        'AUD': 'A$',
        'INR': '\\u20B9',
        'JPY': '\\u00A5'
    };
    const symbol = symbols[currency] || currency;
    const decimals = currency === 'JPY' ? 0 : 2;
    return symbol + amount.toFixed(decimals);
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency = 'USD') {
    const symbols = {
        'USD': '$',
        'EUR': '\\u20AC',
        'GBP': '\\u00A3',
        'CAD': 'C$',
        'AUD': 'A$',
        'INR': '\\u20B9',
        'JPY': '\\u00A5'
    };
    return symbols[currency] || currency;
}

/**
 * Deep clone an object
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce function
 */
export function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * Throttle function
 */
export function throttle(fn, limit) {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Parse float safely
 */
export function parseFloatSafe(val, fallback = 0) {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? fallback : parsed;
}

/**
 * Check if value is a valid positive number
 */
export function isPositiveNumber(val) {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
}

/**
 * Format date with timezone support
 */
export function formatDate(dateString, timeZone, locale) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00Z');
    const resolvedLocale = locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-US');
    const resolvedTimeZone = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    return date.toLocaleDateString(resolvedLocale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: resolvedTimeZone
    });
}

/**
 * Sanitize URL for safe protocols
 */
export function sanitizeUrl(url) {
    if (!url) return '';
    const trimmed = url.trim().toLowerCase();
    const allowedProtocols = ['http:', 'https:', 'data:image/'];
    const isAllowed = allowedProtocols.some(proto => trimmed.startsWith(proto));
    if (!isAllowed) return '';
    return escapeHtml(url);
}

/**
 * Generate invoice number with prefix/format
 */
export function generateInvoiceNumber(prefix = 'INV', format = 'PREFIX-XXX', startNumber = 1) {
    const now = new Date();
    const padLen = format.replace('PREFIX', '').match(/X+/g)?.[0]?.length || 3;
    const paddedNumber = startNumber.toString().padStart(padLen, '0');
    return format
        .replace('PREFIX', prefix)
        .replace(/X+/g, paddedNumber)
        .replace('YYYY', now.getFullYear().toString())
        .replace('MM', (now.getMonth() + 1).toString().padStart(2, '0'));
}
'''

with open('/mnt/d/CODE/Invoice generator/js/utils.js', 'w') as f:
    f.write(content)

print('Done')