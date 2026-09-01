/**
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
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
        '`': '&#96;'
    };
    return str.replace(/[&<>"'`]/g, m => map[m]);
}

/**
 * Convert invoice dataset to CSV string
 */
export function convertToCSV(invoices) {
    if (!invoices || !invoices.length) return '';
    const headers = ['Number', 'Type', 'Date', 'Due Date', 'Client Name', 'Client Email', 'Status', 'Currency', 'Subtotal', 'Tax', 'Discount', 'Late Fee', 'Total', 'Paid At'];

    const rows = invoices.map(i => {
        // Strip line breaks and escape quotes (by doubling them inside quoted block)
        const sanitize = (val) => {
            if (val === null || val === undefined) return '';
            const str = String(val).replace(/(\r\n|\n|\r)/gm, ' ');
            if (str.includes(',') || str.includes('"')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        return [
            sanitize(i.invoiceNumber),
            sanitize(i.documentType || 'Invoice'),
            sanitize(i.invoiceDate),
            sanitize(i.dueDate),
            sanitize(i.clientName),
            sanitize(i.clientEmail),
            sanitize(i.status),
            sanitize(i.currency),
            sanitize(i.subtotal),
            sanitize(i.taxAmount),
            sanitize(i.discountAmount),
            sanitize(i.lateFeeAmount),
            sanitize(i.total),
            sanitize(i.paid_at || '')
        ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
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
        'EUR': '\u20AC',
        'GBP': '\u00A3',
        'CAD': 'C$',
        'AUD': 'A$',
        'INR': '\u20B9',
        'JPY': '\u00A5'
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
        'EUR': '\u20AC',
        'GBP': '\u00A3',
        'CAD': 'C$',
        'AUD': 'A$',
        'INR': '\u20B9',
        'JPY': '\u00A5'
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
    // Escape HTML special characters to prevent attribute injection
    return url
        .replace(/&/g, '&')
        .replace(/"/g, '"')
        .replace(/'/g, '&#039;')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/`/g, '&#96;');
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
