/**
 * Invoice calculation and formatting utilities
 */
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
        this.invoiceDate = data.invoiceDate || new Date().toISOString().split('T')[0];
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
        this.customFields = Array.isArray(data.customFields) ? data.customFields : [];

        this.items = (data.items || []).filter(item => item != null).map(item => ({
            id: item.id || Invoice.generateId(),
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

    static generateId() {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    /**
     * Add a new item to the invoice
     */
    addItem(description = '', quantity = 1, unitPrice = 0, unit = 'Qty') {
        this.items.push({
            id: Invoice.generateId(),
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
        const item = this.items.find(i => i.id === itemId);
        if (item) {
            const { id, ...safeUpdates } = updates;
            Object.assign(item, safeUpdates);
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

    /**
     * Calculate total
     */
    getTotal() {
        const subtotal = this.getSubtotal();
        const discountAmount = this.getDiscountAmount();
        const discountedSubtotal = subtotal - discountAmount;

        if (this.taxType === 'none') {
            return discountedSubtotal;
        }
        if (this.taxType === 'percentage') {
            return discountedSubtotal + (discountedSubtotal * this.taxRate) / 100;
        }
        return discountedSubtotal + this.taxRate;
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
        const symbol = this.getCurrencySymbol();
        return symbol + amount.toFixed(2);
    }

    /**
     * Format date with timezone support
     */
    formatDate(dateString) {
        if (!dateString) return '';
        const tz = localStorage.getItem('invoice-tz') || Intl.DateTimeFormat().resolvedOptions().timeZone;
        const date = new Date(dateString + 'T12:00:00');
        const locale = (typeof i18n !== 'undefined' && i18n.currentLocale) || navigator.language || 'en-US';
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
            if (item.quantity < 0) {
                errors.push(`Item ${index + 1}: Quantity cannot be negative`);
            }
            if (item.unitPrice < 0) {
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
                const unitLabel = item.unit && item.unit !== 'Qty' ? ` ${this.escapeHtml(item.unit)}` : '';
                return `
                    <tr>
                        <td class="item-desc" data-label="${this.escapeHtml(typeof i18n !== 'undefined' && i18n.t ? i18n.t('description') : 'Description')}">${this.escapeHtml(item.description)}</td>
                        <td class="text-right" data-label="${this.escapeHtml(typeof i18n !== 'undefined' && i18n.t ? i18n.t('qty') : 'Qty')}">${item.quantity.toFixed(2)}${unitLabel}</td>
                        <td class="text-right" data-label="${this.escapeHtml(typeof i18n !== 'undefined' && i18n.t ? i18n.t('rate') : 'Rate')}">${symbol}${item.unitPrice.toFixed(2)}</td>
                        <td class="text-right" data-label="${this.escapeHtml(typeof i18n !== 'undefined' && i18n.t ? i18n.t('amount') : 'Amount')}"><strong>${symbol}${(item.quantity * item.unitPrice).toFixed(2)}</strong></td>
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
                                    <span class="custom-field-name">${this.escapeHtml(f.name)}:</span>
                                    <span class="custom-field-value">${this.escapeHtml(f.value)}</span>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }
            }

            let taxHTML = '';
            if (this.taxType !== 'none') {
                taxHTML = `
                    <div class="totals-row highlight">
                        <span>${t('tax')} (${this.taxType === 'percentage' ? this.taxRate + '%' : symbol + this.taxRate.toFixed(2)})</span>
                        <span>${symbol}${this.getTaxAmount().toFixed(2)}</span>
                    </div>
                `;
            }

            let discountHTML = '';
            if (this.discountType !== 'none') {
                discountHTML = `
                    <div class="totals-row highlight">
                        <span>${t('discount')} (${this.discountType === 'percentage' ? this.discountValue + '%' : symbol + this.discountValue.toFixed(2)})</span>
                        <span>-${symbol}${this.getDiscountAmount().toFixed(2)}</span>
                    </div>
                `;
            }

            let logoHTML = '';
            if (this.companyLogo) {
                logoHTML = `<div class="invoice-logo"><img src="${this.sanitizeUrl(this.companyLogo)}" alt="Company Logo" style="max-width: 100%; max-height: 100%;"></div>`;
            } else {
                logoHTML = `<div></div>`;
            }

            let notesHTML = '';
            if (this.notes) {
                notesHTML = `
                    <div class="invoice-notes">
                        <h4>${t('notes')}</h4>
                        <p>${this.escapeHtml(this.notes).replace(/\n/g, '<br>')}</p>
                    </div>
                `;
            }

            let signatureHTML = '';
            if (this.signature) {
                signatureHTML = `
                    <div class="invoice-signature">
                        <img src="${this.sanitizeUrl(this.signature)}" alt="${t('signature')}" style="max-width: 100%; max-height: 100%;">
                        <div>
                            <span class="sig-label">${t('signature')}</span>
                        </div>
                    </div>
                `;
            }

            let paymentLinkHTML = '';
            if (this.paymentLink) {
                paymentLinkHTML = `
                    <a href="${this.sanitizeUrl(this.paymentLink)}" target="_blank" class="invoice-payment-link">
                        💳 ${t('payNow')}
                    </a>
                `;
            }

            return `
                <div class="invoice">
                    <div class="invoice-header">
                        ${logoHTML}
                        <div class="invoice-title">
                            <h1 style="text-transform: uppercase;">${this.escapeHtml(this.documentType)}</h1>
                            <p class="invoice-number">#${this.escapeHtml(this.invoiceNumber)}</p>
                        </div>
                    </div>

                    <div class="invoice-details">
                        <div class="invoice-from">
                            <h3>${t('from')}</h3>
                            <p>
                                <strong>${this.escapeHtml(this.companyName)}</strong>
                                ${this.escapeHtml(this.companyAddress) ? this.escapeHtml(this.companyAddress) + '<br>' : ''}${this.escapeHtml(this.companyEmail) ? this.escapeHtml(this.companyEmail) + '<br>' : ''}${this.escapeHtml(this.companyPhone)}
                            </p>
                        </div>

                        <div class="invoice-to">
                            <h3>${t('billedTo')}</h3>
                            <p>
                                <strong>${this.escapeHtml(this.clientName)}</strong>
                                ${this.escapeHtml(this.clientAddress) ? this.escapeHtml(this.clientAddress) + '<br>' : ''}${this.escapeHtml(this.clientEmail) ? this.escapeHtml(this.clientEmail) + '<br>' : ''}${this.escapeHtml(this.clientPhone)}
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
                                <span class="meta-value">${this.escapeHtml(this.paymentTerms)}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">${t('currency')}</span>
                                <span class="meta-value">${this.escapeHtml(this.currency)}</span>
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
                                <span>${symbol}${this.getSubtotal().toFixed(2)}</span>
                            </div>
                            ${taxHTML}
                            ${discountHTML}
                            <div class="totals-row total">
                                <span>${t('amountDue')}</span>
                                <span>${symbol}${this.getTotal().toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    ${paymentLinkHTML}
                    ${notesHTML}
                    ${signatureHTML}
                </div>
            `;
        } catch (e) {
            return `<div style="color:red; font-size:16px;">Failed to generate template: ${this.escapeHtml(e.message)}</div>`;
        }
    }

    /**
     * Escape HTML special characters
     */
    escapeHtml(text) {
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
     * Sanitize a URL to block dangerous URI schemes.
     * Prevents javascript: and vbscript: URIs from being used
     * in img src or a href attributes.
     * Also escapes HTML special characters to prevent attribute injection.
     */
    sanitizeUrl(url) {
        if (!url) return '';
        // Block javascript and vbscript, but allow data:image/ for base64 encoded images
        if (/^(javascript|vbscript):/i.test(url.trim())) return '';
        if (/^data:/i.test(url.trim()) && !/^data:image\//i.test(url.trim())) return '';
        // Escape HTML special characters to prevent breaking out of attributes
        return url
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/`/g, '&#96;');
    }
}

export default Invoice;
// CJS compat: allow `require('./invoice.js')` in tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Invoice;
    module.exports.default = Invoice;
}
