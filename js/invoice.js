/**
 * Invoice calculation and formatting utilities
 */
import { escapeHtml as escapeHtmlUtil, sanitizeUrl as sanitizeUrlUtil, generateId, deepClone } from './utils.js';

class Invoice {
    constructor(data = {}) {
        this.id = data.id ?? null;
        this.createdAt = data.createdAt ?? null;
        this.companyName = data.companyName ?? '';
        this.companyEmail = data.companyEmail ?? '';
        this.companyPhone = data.companyPhone ?? '';
        this.companyAddress = data.companyAddress ?? '';
        this.companyLogo = data.companyLogo ?? '';

        this.clientName = data.clientName ?? '';
        this.clientEmail = data.clientEmail ?? '';
        this.clientPhone = data.clientPhone ?? '';
        this.clientAddress = data.clientAddress ?? '';

        this.invoiceNumber = data.invoiceNumber ?? 'INV-001';
        this.invoiceDate = data.invoiceDate ?? new Date().toISOString().split('T')[0];
        this.dueDate = data.dueDate || '';
        this.currency = data.currency || 'USD';
        this.paymentTerms = data.paymentTerms || 'Net 30';
        this.notes = data.notes || '';

        // Competitor enhancements
        this.documentType = data.documentType || 'Invoice';
        this.paymentLink = data.paymentLink || '';
        this.signature = data.signature || '';
        this.status = data.status || 'draft';
        this.recurring = data.recurring || 'none';

        // Custom fields
this.customFields = Array.isArray(data.customFields)
            ? deepClone(data.customFields)
            : [];

        this.items = (data.items || []).filter(item => item != null).map(item => ({
            id: item.id || generateId(),
            description: item.description || '',
            quantity: parseFloat(item.quantity) || 0,
            unitPrice: parseFloat(item.unitPrice) || 0,
            unit: item.unit || 'Qty'
        }));
        this.taxType = data.taxType || 'none';
        this.taxRate = parseFloat(data.taxRate) || 0;
        this.discountType = data.discountType || 'none';
        this.discountValue = parseFloat(data.discountValue) || 0;
    }

    /**
     * Add a new item to the invoice
     */
    addItem(description = '', quantity = 1, unitPrice = 0, unit = 'Qty') {
        this.items.push({
            id: generateId(),
            description,
            quantity: parseFloat(quantity) || 0,
            unitPrice: parseFloat(unitPrice) || 0,
            unit: unit
        });
        return this.items[this.items.length - 1];
    }

    /**
     * Remove an item by ID
     */
    removeItem(itemId) {
        this.items = this.items.filter(item => item.id !== itemId);
    }

    /**
     * Update an item
     */
    updateItem(itemId, updates) {
        const item = this.items.find(i => String(i.id) === String(itemId));
        if (item) {
            if (updates.description !== undefined) item.description = updates.description;
            if (updates.quantity !== undefined) item.quantity = parseFloat(updates.quantity) || 0;
            if (updates.unitPrice !== undefined) item.unitPrice = parseFloat(updates.unitPrice) || 0;
            if (updates.unit !== undefined) item.unit = updates.unit;
        } else {
            console.warn("Item not found:", itemId);
        }
    }

    /**
     * Calculate subtotal (sum of all line items)
     */
    getSubtotal() {
        return this.items.reduce((sum, item) => {
            return sum + (item.quantity * item.unitPrice);
        }, 0);
    }

    /**
     * Calculate tax amount
     * Tax is calculated on discounted subtotal (subtotal - discount)
     */
    getTaxAmount() {
        if (this.taxType === 'none') {
            return 0;
        }
        const subtotal = this.getSubtotal();
        const discountAmount = this.getDiscountAmount();
        const taxableAmount = subtotal - discountAmount;
        if (this.taxType === 'percentage') {
            return (taxableAmount * this.taxRate) / 100;
        }
        return this.taxRate;
    }

    /**
     * Calculate discount amount
     */
    getDiscountAmount() {
        if (this.discountType === 'none') {
            return 0;
        }
        const subtotal = this.getSubtotal();
        if (this.discountType === 'percentage') {
            return (subtotal * this.discountValue) / 100;
        }
        return this.discountValue;
    }

    getLateFeeAmount() {
        if (!this.lateFeeType || this.lateFeeType === 'none') {
            return 0;
        }
        const subtotal = this.getSubtotal();
        const discountAmount = this.getDiscountAmount();
        const taxAmount = this.getTaxAmount();
        const baseTotal = (subtotal - discountAmount) + taxAmount;
        if (this.lateFeeType === 'percentage') {
            return (baseTotal * this.lateFeeValue) / 100;
        }
        return this.lateFeeValue;
    }

    /**
     * Calculate total
     * Tax is calculated on discounted subtotal
     * Late fees are applied to post-tax total
     */
    getTotal() {
        const subtotal = this.getSubtotal();
        const discountAmount = this.getDiscountAmount();
        const taxAmount = this.getTaxAmount();
        const lateFeeAmount = this.getLateFeeAmount();
        const discountedSubtotal = subtotal - discountAmount;

        return discountedSubtotal + taxAmount + lateFeeAmount;
    }

    /**
     * Get currency symbol
     */
    getCurrencySymbol() {
        const symbols = {
            'USD': '$',
            'EUR': '\u20AC',
            'GBP': '\u00A3',
            'CAD': 'C$',
            'AUD': 'A$',
            'INR': '\u20B9',
            'JPY': '\u00A5'
        };
        return symbols[this.currency] || this.currency;
    }

    /**
     * Format number as currency
     */
    formatCurrency(amount) {
        if (typeof i18n !== 'undefined' && i18n.formatCurrency) {
            return i18n.formatCurrency(amount, this.currency);
        }
        const symbol = this.getCurrencySymbol();
        const decimals = this.currency === 'JPY' ? 0 : 2;
        return symbol + amount.toFixed(decimals);
    }

    /**
     * Format date with timezone support
     */
    formatDate(dateString) {
        if (!dateString) return '';
        if (typeof i18n !== 'undefined' && i18n.formatDate) {
            return i18n.formatDate(dateString);
        }
        const tz = (typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem('invoice-tz') : null) || Intl.DateTimeFormat().resolvedOptions().timeZone;
        // Parse as local noon to avoid DST boundary shifts at midnight
        // dateString is YYYY-MM-DD; appending T12:00:00 (no Z) treats it as local time
        const date = new Date(dateString + 'T12:00:00');
        const locale = (typeof i18n !== 'undefined' && i18n.currentLocale) || (typeof navigator !== 'undefined' ? navigator.language : 'en-US') || 'en-US';
        return date.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: tz
        });
    }

    /**
     * Validate invoice data
     */
    validate(isDraft = false) {
        const errors = [];

        if (!this.invoiceNumber.trim()) {
            errors.push('Invoice number is required');
        }

        if (!isDraft) {
            if (!this.clientName.trim()) {
                errors.push('Client name is required');
            }
            if (!this.invoiceDate) {
                errors.push('Invoice date is required');
            }
            if (!this.dueDate) {
                errors.push('Due date is required');
            }
            if (this.items.length === 0) {
                errors.push('At least one item is required');
            }
            if (this.invoiceDate && this.dueDate && new Date(this.invoiceDate) > new Date(this.dueDate)) {
                errors.push('Due date must be after invoice date');
            }
        }

        // Validate items for negative values
        this.items.forEach((item, index) => {
            const qty = parseFloat(item.quantity);
            const price = parseFloat(item.unitPrice);
            if (isNaN(qty) || qty < 0) {
                errors.push(`Item ${index + 1}: Quantity cannot be negative`);
            }
            if (isNaN(price) || price < 0) {
                errors.push(`Item ${index + 1}: Unit price cannot be negative`);
            }
        });

        // Validate tax rate
        if (this.taxType === 'percentage' && (this.taxRate < 0 || this.taxRate > 100)) {
            errors.push('Tax rate must be between 0 and 100%');
        } else if (this.taxType === 'fixed' && this.taxRate < 0) {
            errors.push('Fixed tax amount cannot be negative');
        }

        // Validate discount
        if (this.discountType === 'percentage' && (this.discountValue < 0 || this.discountValue > 100)) {
            errors.push('Discount percentage must be between 0 and 100%');
        } else if (this.discountType === 'fixed' && this.discountValue < 0) {
            errors.push('Fixed discount amount cannot be negative');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            id: this.id,
            companyName: this.companyName,
            companyEmail: this.companyEmail,
            companyPhone: this.companyPhone,
            companyAddress: this.companyAddress,
            companyLogo: this.companyLogo,
            clientName: this.clientName,
            clientEmail: this.clientEmail,
            clientPhone: this.clientPhone,
            clientAddress: this.clientAddress,
            invoiceNumber: this.invoiceNumber,
            invoiceDate: this.invoiceDate,
            dueDate: this.dueDate,
            currency: this.currency,
            paymentTerms: this.paymentTerms,
            notes: this.notes,
            items: this.items,
            taxType: this.taxType,
            taxRate: this.taxRate,
            discountType: this.discountType,
            discountValue: this.discountValue,
            lateFeeType: this.lateFeeType || 'none',
            lateFeeValue: this.lateFeeValue || 0,
            documentType: this.documentType,
            paymentLink: this.paymentLink,
            signature: this.signature,
            status: this.status,
            recurring: this.recurring,
            customFields: this.customFields,
            subtotal: this.getSubtotal(),
            taxAmount: this.getTaxAmount(),
            discountAmount: this.getDiscountAmount(),
            total: this.getTotal(),
            createdAt: this.createdAt
        };
    }

    /**
     * Create from JSON
     */
    static fromJSON(json) {
        return new Invoice(json);
    }

    /**
     * Add a custom field
     */
    addCustomField(name = '', value = '') {
        this.customFields.push({ name, value });
        return this.customFields[this.customFields.length - 1];
    }

    /**
     * Remove a custom field by index
     */
    removeCustomField(index) {
        if (index >= 0 && index < this.customFields.length) {
            this.customFields.splice(index, 1);
        }
    }

    /**
     * Update a custom field
     */
    updateCustomField(index, updates) {
        if (index >= 0 && index < this.customFields.length) {
            Object.assign(this.customFields[index], updates);
        }
    }

    /**
     * Get valid status transitions
     */
    getValidTransitions() {
        const transitions = {
            'draft': ['sent'],
            'sent': ['paid', 'overdue'],
            'paid': ['sent'],
            'overdue': ['paid', 'sent']
        };
        return transitions[this.status] || [];
    }

    /**
     * Generate HTML for invoice
     */
    generateHTML() {
        try {
            const symbol = this.getCurrencySymbol();
            const t = (key) => {
                if (typeof i18n !== 'undefined' && i18n.t) {
                    return i18n.t(key);
                }
                return key;
            };

            let itemsHTML = this.items.map(item => {
                const unitLabel = item.unit && item.unit !== 'Qty' ? ` ${escapeHtmlUtil(item.unit)}` : '';
                const safeSymbol = escapeHtmlUtil(symbol);

                return `
                    <tr>
                        <td class="item-desc" data-label="${escapeHtmlUtil(typeof i18n !== 'undefined' && i18n.t ? i18n.t('description') : 'Description')}">
                            <div style="margin-bottom: 2px; word-break: break-word;">${escapeHtmlUtil(item.description)}</div>
                        </td>
                        <td class="text-right" data-label="${escapeHtmlUtil(typeof i18n !== 'undefined' && i18n.t ? i18n.t('qty') : 'Qty')}">${item.quantity.toFixed(2)}${unitLabel}</td>
                        <td class="text-right" data-label="${escapeHtmlUtil(typeof i18n !== 'undefined' && i18n.t ? i18n.t('rate') : 'Rate')}">${this.formatCurrency(item.unitPrice)}</td>
                        <td class="text-right" data-label="${escapeHtmlUtil(typeof i18n !== 'undefined' && i18n.t ? i18n.t('amount') : 'Amount')}"><strong>${this.formatCurrency(item.quantity * item.unitPrice)}</strong></td>
                    </tr>
                `;
            }).join('');

            // Custom fields display
            let customFieldsHTML = '';
            if (this.customFields && this.customFields.length > 0) {
                const fields = this.customFields.filter(f => f.name && f.value);
                if (fields.length > 0) {
                    customFieldsHTML = `
                        <div class="invoice-custom-fields">
                            ${fields.map(f => `
                                <div class="custom-field-row">
                                    <span class="custom-field-name">${escapeHtmlUtil(f.name)}:</span>
                                    <span class="custom-field-value">${escapeHtmlUtil(f.value)}</span>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }
            }

            let taxHTML = '';
            if (this.taxType !== 'none') {
                const safeSymbol = escapeHtmlUtil(symbol);
                taxHTML = `
                    <div class="totals-row highlight">
                        <span>${t('tax')} (${this.taxType === 'percentage' ? this.taxRate + '%' : this.formatCurrency(this.taxRate)})</span>
                        <span>${this.formatCurrency(this.getTaxAmount())}</span>
                    </div>
                `;
            }

            let discountHTML = '';
            if (this.discountType !== 'none') {
                const safeSymbol = escapeHtmlUtil(symbol);
                discountHTML = `
                    <div class="totals-row highlight">
                        <span>${t('discount')} (${this.discountType === 'percentage' ? this.discountValue + '%' : this.formatCurrency(this.discountValue)})</span>
                        <span>-${this.formatCurrency(this.getDiscountAmount())}</span>
                    </div>
                `;
            }

            let lateFeeHTML = '';
            if (this.lateFeeType && this.lateFeeType !== 'none') {
                const safeSymbol = escapeHtmlUtil(symbol);
                lateFeeHTML = `
                    <div class="totals-row highlight" style="color:var(--danger)">
                        <span>Late Fee (${this.lateFeeType === 'percentage' ? this.lateFeeValue + '%' : this.formatCurrency(this.lateFeeValue)})</span>
                        <span>${this.formatCurrency(this.getLateFeeAmount())}</span>
                    </div>
                `;
            }

            let logoHTML = '';
            if (this.companyLogo) {
                logoHTML = `<div class="invoice-logo"><img src="${sanitizeUrlUtil(this.companyLogo)}" alt="Company Logo" style="max-width: 100%; max-height: 100%;"></div>`;
            } else {
                logoHTML = `<div></div>`;
            }

            let notesHTML = '';
            if (this.notes) {
                notesHTML = `
                    <div class="invoice-notes">
                        <h4>${t('notes')}</h4>
                        <p>${escapeHtmlUtil(this.notes).replace(/\n/g, '<br>')}</p>
                    </div>
                `;
            }

            let signatureHTML = '';
            if (this.signature) {
                signatureHTML = `
                    <div class="invoice-signature">
                        <img src="${sanitizeUrlUtil(this.signature)}" alt="${escapeHtmlUtil(t('signature'))}" style="max-width: 100%; max-height: 100%;">
                        <div>
                            <span class="sig-label">${escapeHtmlUtil(t('signature'))}</span>
                        </div>
                    </div>
                `;
            }

            let paymentLinkUrl = this.paymentLink;
            if (!paymentLinkUrl && this.id && typeof window !== 'undefined' && window.app && window.app.token) {
                // Automatically provide the platform's dynamic payment link if no custom link is provided
                paymentLinkUrl = `${window.location.origin}/api/invoices/${this.id}/pay`;
            }

            let paymentLinkHTML = '';
            // Don't show "Pay Now" on Receipts or Estimates/Quotes out-of-the-box
            if (paymentLinkUrl && this.documentType !== 'Receipt' && this.documentType !== 'Estimate' && this.documentType !== 'Quote') {
                paymentLinkHTML = `
                    <a href="${sanitizeUrlUtil(paymentLinkUrl)}" target="_blank" class="invoice-payment-link">
                        💳 ${t('payNow')}
                    </a>
                `;
            }

            return `
                <div class="invoice">
                    <div class="invoice-header">
                        ${logoHTML}
                        <div class="invoice-title">
                            <h1 style="text-transform: uppercase;">${escapeHtmlUtil(this.documentType)}</h1>
                            <p class="invoice-number">${this.invoiceNumber ? `#${escapeHtmlUtil(this.invoiceNumber)}` : ''}</p>
                        </div>
                    </div>

                    <div class="invoice-details">
                        <div class="invoice-from">
                            <h3>${t('from')}</h3>
                            <p>
                                <strong>${escapeHtmlUtil(this.companyName)}</strong>
                                ${escapeHtmlUtil(this.companyAddress) ? escapeHtmlUtil(this.companyAddress) + '<br>' : ''}${escapeHtmlUtil(this.companyEmail) ? escapeHtmlUtil(this.companyEmail) + '<br>' : ''}${escapeHtmlUtil(this.companyPhone)}
                            </p>
                        </div>

                        <div class="invoice-to">
                            <h3>${t('billedTo')}</h3>
                            <p>
                                <strong>${escapeHtmlUtil(this.clientName)}</strong>
                                ${escapeHtmlUtil(this.clientAddress) ? escapeHtmlUtil(this.clientAddress) + '<br>' : ''}${escapeHtmlUtil(this.clientEmail) ? escapeHtmlUtil(this.clientEmail) + '<br>' : ''}${escapeHtmlUtil(this.clientPhone)}
                            </p>
                        </div>

                        <div class="invoice-meta">
                            <div class="meta-item">
                                <span class="meta-label">${t('dateIssued')}</span>
                                <span class="meta-value">${this.formatDate(this.invoiceDate)}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">${t('dateDue')}</span>
                                <span class="meta-value">${this.formatDate(this.dueDate)}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">${t('terms')}</span>
                                <span class="meta-value">${escapeHtmlUtil(this.paymentTerms)}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">${t('currency')}</span>
                                <span class="meta-value">${escapeHtmlUtil(this.currency)}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Payment Status</span>
                                <span class="meta-value"><strong>${escapeHtmlUtil(this.status === 'completed' ? 'Complete' : (this.status === 'pending' ? 'Pending' : (this.status || 'Pending').replace(/^./, c => c.toUpperCase())))}</strong></span>
                            </div>
                        </div>
                    </div>

                    ${customFieldsHTML}

                    <div class="invoice-items">
                        <table>
                            <thead>
                                <tr>
                                    <th>${t('description')}</th>
                                    <th class="text-right">${t('qty')}/${t('unit')}</th>
                                    <th class="text-right">${t('rate')}</th>
                                    <th class="text-right">${t('amount')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHTML}
                            </tbody>
                        </table>
                    </div>

                    <div class="invoice-totals">
                        <div class="totals-box">
                            <div class="totals-row">
                                <span>${t('subtotal')}</span>
                                <span>${escapeHtmlUtil(this.formatCurrency(this.getSubtotal()))}</span>
                            </div>
                            ${taxHTML}
                            ${discountHTML}
                            ${lateFeeHTML}
                            <div class="totals-row total">
                                <span>${t('amountDue')}</span>
                                <span>${escapeHtmlUtil(this.formatCurrency(this.getTotal()))}</span>
                            </div>
                        </div>
                    </div>

                    ${paymentLinkHTML}
                    ${notesHTML}
                    ${signatureHTML}
                    <div class="invoice-watermark" id="invoiceWatermark">
                        Generated strongly with <span>Invoice Generator</span><br>
                        Remove this watermark by upgrading to Pro.
                    </div>
                </div>
            `;
} catch (e) {
            return `<div style="color:red; font-size:16px;">Failed to generate template: ${escapeHtmlUtil(e.message)}</div>`;
        }
}
}

export default Invoice;
// CJS compat: allow `require('./invoice.js')` in tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Invoice;
    module.exports.default = Invoice;
}
