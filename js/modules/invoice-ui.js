/**
 * Invoice Form UI Module
 * Handles invoice form interactions, items, preview, and form operations
 */

import Invoice from '../invoice.js';
import { escapeHtml, generateId, debounce } from '../utils.js';

export function addItem(prefill = null) {
    if (!this.invoice || typeof this.invoice.addItem !== 'function') {
        if (this.invoice) {
            Object.setPrototypeOf(this.invoice, Invoice.prototype);
        } else {
            this.invoice = new Invoice();
        }
    }
    const description = prefill && prefill.description ? prefill.description : 'New Item';
    const quantity = prefill && prefill.quantity != null ? prefill.quantity : 1;
    const unitPrice = prefill && prefill.unitPrice != null ? prefill.unitPrice : 0;
    const unit = prefill && prefill.unit ? prefill.unit : 'Qty';
    const item = this.invoice.addItem(description, quantity, unitPrice, unit);

    const tbody = document.getElementById('itemsTableBody');
    if (!tbody) {
        // If we are on a page without the invoice form (like templates.html),
        // silently add the item to the model but skip DOM manipulation.
        return item;
    }
    const row = document.createElement('div');
    row.className = 'item-row row-enter';
    row.dataset.itemId = item.id;
    row.innerHTML = `
        <div class="item-row-top">
            <input type="text" class="item-description" value="${escapeHtml(description)}" placeholder="Description" aria-label="Item description">
            <input type="text" class="item-unit" value="${escapeHtml(unit)}" placeholder="Unit" aria-label="Unit">
            <input type="number" class="item-quantity" value="${quantity}" min="0" step="any" aria-label="Quantity">
        </div>
        <div class="item-row-bottom">
            <div class="item-field flex-grow-prices">
                <span class="item-field-label">Unit Price</span>
                <input type="number" class="item-unit-price" value="${unitPrice}" min="0" step="0.01" aria-label="Unit price">
            </div>
            <div class="item-field flex-grow-amount">
                <span class="item-field-label">Amount</span>
                <div class="item-amount">${this.invoice ? this.invoice.getCurrencySymbol() : '$'}${((parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0)).toFixed(2)}</div>
            </div>
            <button type="button" class="remove-item-btn" data-item-id="${escapeHtml(item.id)}" aria-label="Remove item">&times;</button>
        </div>
    `;
    tbody.appendChild(row);

    // Add direct event listeners to the new inputs for immediate response
    const priceInput = row.querySelector('.item-unit-price');
    const qtyInput = row.querySelector('.item-quantity');
    const descInput = row.querySelector('.item-description');
    const unitInput = row.querySelector('.item-unit');

    const triggerUpdate = (e) => {
        if (typeof this.updateItemFromRow === 'function') {
            this.updateItemFromRow(e.target);
        }
    };

    if (priceInput) priceInput.addEventListener('input', triggerUpdate);
    if (qtyInput) qtyInput.addEventListener('input', triggerUpdate);
    if (descInput) descInput.addEventListener('input', triggerUpdate);
    if (unitInput) unitInput.addEventListener('input', triggerUpdate);

    // Explicitly seed the newly added item if it matches any saved price logic
    if (typeof this.updateItemFromRow === 'function') {
        if (descInput) this.updateItemFromRow(descInput);
    }
    this.updateItemAmount(row);
    if (!this._suppressPreview) {
        this.updatePreview();
    }
}

export function removeItem(itemId) {
    if (this.invoice.items && this.invoice.items.length <= 1) {
        this.showNotification('Cannot remove the last item', 'error');
        return;
    }
    if (!this.invoice || typeof this.invoice.removeItem !== 'function') {
        if (this.invoice) {
            Object.setPrototypeOf(this.invoice, Invoice.prototype);
        }
    }
    this.invoice.removeItem(itemId);

    // Find row carefully escaping quotes just in case, but avoid CSS.escape inside quotes
    const safeId = String(itemId).replace(/"/g, '\\"');
    const row = document.querySelector(`div[data-item-id="${safeId}"]`);
    if (row) {
        row.remove();
    } else {
        // Fallback: look through all rows
        document.querySelectorAll('.item-row').forEach(r => {
            if (r.dataset.itemId === itemId) r.remove();
        });
    }

    this.updatePreview();
}

export function updateItemFromRow(target) {
    const row = target.closest('.item-row');
    if (!row) {
        return;
    }
    const itemId = row.dataset.itemId || row.getAttribute('data-item-id');
    const description = row.querySelector('.item-description').value;

    // Check if the user is typing the description and we have a saved price
    if (target.classList.contains('item-description')) {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const savedPrices = JSON.parse(window.localStorage.getItem('savedPrices') || '{}');
                const savedData = savedPrices[description.trim()];
                if (savedData && typeof savedData.price === 'number') {
                    // Update the price input field with the saved price!
                    const priceInput = row.querySelector('.item-unit-price');
                    if (priceInput && (parseFloat(priceInput.value) === 0 || priceInput.value === '')) {
                        priceInput.value = savedData.price;
                    }
                }
            }
        } catch (e) {
            // Ignore
        }
    }

    const qtyInput = row.querySelector('.item-quantity');
    const priceInput = row.querySelector('.item-unit-price');
    const unitInput = row.querySelector('.item-unit');
    
    const readValues = () => {
        const quantityVal = qtyInput ? qtyInput.value : '0';
        const unitPriceVal = priceInput ? priceInput.value : '0';
        const unit = unitInput ? unitInput.value : 'Qty';
        const descriptionValue = row.querySelector('.item-description').value;
        
        const rawQuantity = parseFloat(String(quantityVal).replace(',', '.'));
        const rawUnitPrice = parseFloat(String(unitPriceVal).replace(',', '.'));

        // Check for invalid (NaN) values first
        if (isNaN(rawQuantity) || isNaN(rawUnitPrice)) {
            this.showNotification('Quantity and price must be valid numbers', 'error');
            if (qtyInput && isNaN(rawQuantity)) qtyInput.value = '0';
            if (priceInput && isNaN(rawUnitPrice)) priceInput.value = '0';
            return;
        }

        // Check for negative values before clamping
        if (rawQuantity < 0 || rawUnitPrice < 0) {
            this.showNotification('Quantity and price cannot be negative', 'error');
            if (qtyInput) qtyInput.value = Math.max(0, rawQuantity);
            if (priceInput) priceInput.value = Math.max(0, rawUnitPrice);
            return;
        }

        const parsedQuantity = Math.max(0, rawQuantity);
        const parsedUnitPrice = Math.max(0, rawUnitPrice);

        this.invoice.updateItem(itemId, { description: descriptionValue, quantity: parsedQuantity, unitPrice: parsedUnitPrice, unit });
        this.updateItemAmount(row);
        this.updatePreview();
    };
    
    // Use debounced readValues to prevent rAF leak on rapid typing
    // Create debounced function per row to avoid cross-row interference
    if (!row._debouncedReadValues) {
        row._debouncedReadValues = debounce(readValues, 50);
    }
    
    if (target.tagName === 'INPUT' && (target.type === 'number' || target.type === 'text')) {
        row._debouncedReadValues();
    } else {
        readValues();
    }
}

export function updateItemAmount(row) {
    const quantityVal = row.querySelector('.item-quantity').value; const quantity = parseFloat(String(quantityVal).replace(',', '.')) || 0;
    const unitPriceVal = row.querySelector('.item-unit-price').value; const unitPrice = parseFloat(String(unitPriceVal).replace(',', '.')) || 0;
    const amount = quantity * unitPrice;
    const symbol = this.invoice.getCurrencySymbol();
    row.querySelector('.item-amount').textContent = symbol + amount.toFixed(2);
}

export function initItemActionsDelegation() {
    const tbody = document.getElementById('itemsTableBody');
    if (!tbody || tbody._itemsDelegated) return;
    tbody._itemsDelegated = true;
    tbody.addEventListener('click', (e) => {
        const target = e.target.closest('.save-price-btn, .remove-item-btn');
        if (!target) return;

        const itemId = target.dataset.itemId;
        if (!itemId || !window.app) return;

        if (target.classList.contains('save-price-btn')) {
            window.app.savePrice(target, itemId);
        } else if (target.classList.contains('remove-item-btn')) {
            window.app.removeItem(itemId);
        }
    });
}

export function loadInvoice(data) {
    this.invoice = new Invoice(data);

    const fields = {
        companyName: data.companyName || '',
        companyEmail: data.companyEmail || '',
        companyPhone: data.companyPhone || '',
        companyAddress: data.companyAddress || '',
        companyLogoBase64: data.companyLogo || '',
        clientName: data.clientName || '',
        clientEmail: data.clientEmail || '',
        clientPhone: data.clientPhone || '',
        clientAddress: data.clientAddress || '',
        invoiceNumber: data.invoiceNumber || '',
        invoiceDate: data.invoiceDate || '',
        dueDate: data.dueDate || '',
        currency: data.currency || 'USD',
        paymentTerms: data.paymentTerms || 'Net 30',
        notes: data.notes || '',
        documentType: data.documentType || 'Invoice',
        paymentLink: data.paymentLink || '',
        recurringType: data.recurring || 'none',
        taxType: data.taxType || 'none',
        taxRate: data.taxRate || 0,
        discountType: data.discountType || 'none',
        discountValue: data.discountValue || 0,
        lateFeeType: data.lateFeeType || 'none',
        lateFeeValue: data.lateFeeValue || 0,
    };
    for (const [id, value] of Object.entries(fields)) {
        const el = document.getElementById(id);
        if (el) {
            el.value = value;
            if (el._flatpickr) {
                el._flatpickr.setDate(value);
            }
        }
    }

    this.updateTaxDisplay();
    this.updateDiscountDisplay();

    this.syncCustomSelects();

    if (data.signature) {
        document.getElementById('signatureBase64').value = data.signature;
        const canvas = document.getElementById('signatureCanvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                // Update aria-label for accessibility
                canvas.setAttribute('aria-label', 'Signature drawn');
                const statusEl = document.getElementById('signatureStatus');
                if (statusEl) statusEl.textContent = 'Signature loaded';
            };
            img.src = data.signature;
        }
    } else {
        this.clearSignature();
    }

    const tbody = document.getElementById('itemsTableBody');
    tbody.innerHTML = '';
    if (this.invoice.items && this.invoice.items.length > 0) {
        this.invoice.items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'item-row row-enter';
            row.dataset.itemId = item.id;
            row.innerHTML = `
                <div class="item-row-top">
                    <input type="text" class="item-description" value="${escapeHtml(item.description || '')}" placeholder="Description" aria-label="Item description">
                    <input type="text" class="item-unit" value="${escapeHtml(item.unit || 'Qty')}" placeholder="Unit" aria-label="Unit">
                    <input type="number" class="item-quantity" value="${item.quantity || 0}" min="0" step="any" aria-label="Quantity">
                </div>
                <div class="item-row-bottom">
                    <div class="item-field flex-grow-prices">
                        <span class="item-field-label">Unit Price</span>
                        <input type="number" class="item-unit-price" value="${item.unitPrice || 0}" min="0" step="0.01" aria-label="Unit price">
                    </div>
                    <div class="item-field flex-grow-amount">
                        <span class="item-field-label">Amount</span>
                        <div class="item-amount">${this.invoice.getCurrencySymbol()}${((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toFixed(2)}</div>
            </div>
            <button type="button" class="remove-item-btn" data-item-id="${escapeHtml(item.id)}" aria-label="Remove item">&times;</button>
                </div>
            `;
            tbody.appendChild(row);
            
            // Add direct event listeners for live updates
            const priceInput = row.querySelector('.item-unit-price');
            const qtyInput = row.querySelector('.item-quantity');
            const descInput = row.querySelector('.item-description');
            const unitInput = row.querySelector('.item-unit');
            
            const triggerUpdate = (e) => {
                if (typeof this.updateItemFromRow === 'function') {
                    this.updateItemFromRow(e.target);
                }
            };
            
            if (priceInput) priceInput.addEventListener('input', triggerUpdate);
            if (qtyInput) qtyInput.addEventListener('input', triggerUpdate);
            if (descInput) descInput.addEventListener('input', triggerUpdate);
            if (unitInput) unitInput.addEventListener('input', triggerUpdate);
        });
    }
    this.updatePreview();
    this.updateRecurringPreview();
    this.renderSavedProductsDropdown();

    this.initItemActionsDelegation();
}

export function loadLastDraft() {
    // Check if user previously dismissed the prompt
    if (localStorage.getItem('invoice-dismissed-draft-prompt') === 'true') {
        return;
    }
    const invoices = this.storage.getInvoices();
    if (invoices.length > 0) {
        const drafts = invoices.filter(inv => inv.status === 'draft').sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
        if (drafts.length > 0) {
            const lastInvoice = drafts[0];
            const promptMessage = this.isFormDirty()
                ? `A saved invoice draft (#${lastInvoice.invoiceNumber}) is available. Do you want to load it? Warning: This will overwrite your current unsaved changes.`
                : `Load your last saved invoice draft (#${lastInvoice.invoiceNumber})?`;

            this.showConfirm(promptMessage, { showDontAskAgain: true }).then(result => {
                if (result.confirmed) {
                    localStorage.removeItem('invoice-dismissed-draft-prompt');
                    this.loadInvoice(lastInvoice);
                } else if (result.dontAskAgain) {
                    localStorage.setItem('invoice-dismissed-draft-prompt', 'true');
                }
            });
        }
    }
}

/**
 * Common save logic for draft and invoice
 * @param {Object} options - Save options
 * @param {boolean} options.isDraft - Whether saving as draft
 * @param {string} options.status - Invoice status (for non-draft)
 * @param {Event} options.btnEvent - Button event for saveInvoice
 * @param {string} options.successMessage - Success message
 * @param {boolean} options.refreshData - Whether to refresh data after save
 */
async function _saveInvoice({ isDraft, status, btnEvent, successMessage, refreshData }) {
    // Mutex to prevent race with autoSaveDraft
    if (this._saving) {
        this.showNotification('Save already in progress', 'info');
        return;
    }
    this._saving = true;
    
    try {
        this.updateInvoiceFromForm();

        // If the document type is a Receipt and we are not just saving a draft, automatically flag actual status as paid
        if (!isDraft && this.invoice.documentType === 'Receipt' && status !== 'paid') {
            status = 'paid';
        }

        if (!this.validateForm(isDraft)) {
            this.showNotification(isDraft ? 'Please fill in the invoice number' : 'Please fill in all required fields correctly', 'error');
            return;
        }
        const validation = this.invoice.validate(isDraft);
        if (!validation.isValid) {
            this.showNotification(`Please fix errors:\n${validation.errors.join('\n')}`, 'error');
            return;
        }
        const isNewInvoice = !this.invoice.id;
        if (isNewInvoice) this.invoice.id = generateId();

        if (!isDraft && isNewInvoice) {
            this.invoice.invoiceNumber = this.storage.getNextInvoiceNumber();
            this.invoice.status = status;
            this.updatePreview(); // update preview before saving (to reflect status)
        } else if (!isDraft) {
            this.invoice.status = status;
            this.updatePreview();
        }

        const saveBtn = btnEvent ? btnEvent.currentTarget : document.querySelector(".form-actions button");
        const originalText = saveBtn ? saveBtn.innerHTML : '';
        if (saveBtn) {
            saveBtn.disabled = true;
        }

                const json = this.invoice.toJSON();
        
        if (this.token) {
            try {
                const result = await this.apiSaveInvoice(json);
                if (!result) {
                    this.showNotification(isDraft ? 'Failed to save draft' : 'Failed to save invoice', 'error');
                    return;
                }
            } catch (err) {
                this.showNotification(isDraft ? 'Failed to save draft' : 'Failed to save invoice', 'error');
                return;
            }
        } else {
            const alreadyExists = this.storage.getInvoices().some(inv => inv.invoiceNumber === this.invoice.invoiceNumber && String(inv.id) !== String(this.invoice.id));
            if (alreadyExists) {
                this.showNotification(`Invoice number ${this.invoice.invoiceNumber} already used by another invoice.`, 'error');
                return;
            }
            const success = this.storage.saveInvoice(json);
            if (!success) {
                this.showNotification(isDraft ? 'Failed to save draft' : 'Failed to save invoice', 'error');
                return;
            }
        }
        this.showNotification(successMessage, 'success');
        if (this.showTypewriter) {
            this.showTypewriter('Invoice Saved', { typingSpeed: 45 });
        }
        this.showMigrationPrompt();
        this.updatePreview();

        if (refreshData) {
            if (this.token) {
                await this.apiGetInvoices();
            }
            await this.updateAnalyticsDashboard();
        }
    } catch (err) {
        this.showNotification(err.message || (isDraft ? 'Failed to save draft' : 'Failed to save invoice'), 'error');
    } finally {
        this._saving = false;
        if (saveBtn) {
            saveBtn.disabled = false;
        }
    }
}

export async function saveDraft() {
    this.updateInvoiceFromForm();
    await _saveInvoice.call(this, {
        isDraft: true,
        successMessage: 'Draft saved successfully',
        refreshData: false
    });
}

export async function saveInvoice(status = 'sent', btnEvent = null) {
    await _saveInvoice.call(this, {
        isDraft: false,
        status,
        btnEvent,
        successMessage: 'Invoice saved successfully',
        refreshData: true
    });
}

export function resetForm() {
    // Use a flag to prevent reset after navigation away
    const resetId = Symbol('resetForm');
    this._currentResetId = resetId;
    
    this.showConfirm('Are you sure you want to reset the form? All unsaved changes will be lost.').then(confirmed => {
        // Check if another reset was initiated or component unmounted
        if (this._currentResetId !== resetId) return;
        if (!confirmed) return;
        this._suppressPreview = true;
        try {
            document.getElementById('companyName').value = 'My Company';
            document.getElementById('companyEmail').value = 'company@example.com';
            document.getElementById('companyPhone').value = '+1 (555) 000-0000';
            document.getElementById('companyAddress').value = '123 Main St, New York, NY';
            document.getElementById('companyLogoBase64').value = '';
            document.getElementById('clientName').value = '';
            document.getElementById('clientEmail').value = '';
            document.getElementById('clientPhone').value = '';
            document.getElementById('clientAddress').value = '';
            document.getElementById('invoiceNumber').value = this.storage.peekNextInvoiceNumber();
            document.getElementById('invoiceDate').value = '';
            document.getElementById('dueDate').value = '';
            document.getElementById('currency').value = 'USD';
            document.getElementById('paymentTerms').value = 'Net 30';
            document.getElementById('notes').value = '';
            document.getElementById('documentType').value = 'Invoice';
            document.getElementById('paymentLink').value = '';
            document.getElementById('recurringType').value = 'none';
            document.getElementById('taxType').value = 'none';
            document.getElementById('taxRate').value = 0;
            document.getElementById('discountType').value = 'none';
            document.getElementById('discountValue').value = 0;
            document.getElementById('lateFeeType').value = 'none';
            document.getElementById('lateFeeValue').value = 0;

            this.invoice = new Invoice();
            this.clearSignature();
            document.getElementById('itemsTableBody').innerHTML = '';
            this.addItem();
            this.setTodayDates();
            this.updateTaxDisplay();
            this.updateDiscountDisplay();
            this.syncCustomSelects();
        this.renderSavedProductsDropdown();
        } finally {
            this._suppressPreview = false;
        }
        this.updatePreview();
        this.showNotification('Form reset', 'success');
    });
}

export function updatePreview() {
    const previewEl = document.getElementById('invoicePreview');
    if (previewEl) {
        const html = this.invoice.generateHTML();
        previewEl.innerHTML = html;
    }
}

export function updateTotals() {
    if (!this.invoice) {
        this.invoice = new Invoice();
    }
    const val = (id) => { const e = document.getElementById(id); return e ? e.value : ''; };
    this.invoice.taxType = val('taxType');
    this.invoice.taxRate = parseFloat(val('taxRate')) || 0;
    this.invoice.discountType = val('discountType');
    this.invoice.discountValue = parseFloat(val('discountValue')) || 0;
    this.invoice.lateFeeType = val('lateFeeType');
    this.invoice.lateFeeValue = parseFloat(val('lateFeeValue')) || 0;
    if (!this._suppressPreview) {
        this.updatePreview();
    }
    this.updatePreview();
}

export function updateInvoiceFromForm() {
    try {
        if (!this.invoice) {
            this.invoice = new Invoice();
        }
        const el = (id) => document.getElementById(id);
        const val = (id) => { const e = el(id); return e ? e.value : ''; };

        this.invoice.companyName = val('companyName');
        this.invoice.companyEmail = val('companyEmail');
        this.invoice.companyPhone = val('companyPhone');
        this.invoice.companyAddress = val('companyAddress');
        this.invoice.companyLogo = val('companyLogoBase64');

        this.invoice.clientName = val('clientName');
        this.invoice.clientEmail = val('clientEmail');
        this.invoice.clientPhone = val('clientPhone');
        this.invoice.clientAddress = val('clientAddress');

        this.invoice.invoiceNumber = val('invoiceNumber');
        this.invoice.invoiceDate = val('invoiceDate');
        this.invoice.dueDate = val('dueDate');
        this.invoice.currency = val('currency');
        this.invoice.paymentTerms = val('paymentTerms');
        this.invoice.notes = val('notes');

        this.invoice.documentType = val('documentType');
        this.invoice.paymentLink = val('paymentLink');
        this.invoice.recurring = val('recurringType');

        this.invoice.taxType = val('taxType');
        this.invoice.taxRate = parseFloat(val('taxRate')) || 0;
        this.invoice.discountType = val('discountType');
        this.invoice.discountValue = parseFloat(val('discountValue')) || 0;
        this.invoice.lateFeeType = val('lateFeeType');
        this.invoice.lateFeeValue = parseFloat(val('lateFeeValue')) || 0;

        // Sync line items from DOM
        const itemRows = document.querySelectorAll('#itemsTableBody .item-row');
        itemRows.forEach((row, idx) => {
            const itemId = row.dataset.itemId || row.getAttribute('data-item-id');
            const description = row.querySelector('.item-description').value;
            const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
            const unitPrice = parseFloat(row.querySelector('.item-unit-price').value) || 0;
            const unit = row.querySelector('.item-unit').value || 'Qty';
            if (itemId) {
                this.invoice.updateItem(itemId, { description, quantity, unitPrice, unit });
            }
        });

        this.updateTotals();
        this.updateRecurringPreview();
        this.renderSavedProductsDropdown();
    } catch (e) {
        this.showNotification(`Error updating invoice: ${e.message}`, 'error');
    }
}

const RECURRING_INTERVALS_DAYS = { weekly: 7, monthly: 30, quarterly: 90 };

/**
 * Show a live "Next invoice: <date>" hint when a recurring interval is selected,
 * based on the invoice date and the chosen cadence. Mirrors the server cron in
 * server/index.js (intervals weekly=7 / monthly=30 / quarterly=90 days).
 */
export function updateRecurringPreview() {
    const el = document.getElementById('recurringPreview');
    if (!el) return;
    const interval = (document.getElementById('recurringType') || {}).value;
    if (!interval || interval === 'none' || !RECURRING_INTERVALS_DAYS[interval]) {
        el.textContent = '';
        el.style.display = 'none';
        return;
    }
    const dateStr = (document.getElementById('invoiceDate') || {}).value;
    const base = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
    if (isNaN(base.getTime())) {
        el.textContent = '';
        el.style.display = 'none';
        return;
    }
    const next = new Date(base);
    next.setDate(next.getDate() + RECURRING_INTERVALS_DAYS[interval]);
    const tz = localStorage.getItem('invoice-tz') || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const formatted = next.toLocaleDateString(navigator.language || 'en-US', { timeZone: tz });
    const t = (k) => typeof i18n !== 'undefined' ? i18n.t(k) : k;
    el.textContent = t('invoiceForm.recurring.nextDate').replace('{date}', formatted);
    el.style.display = '';
}
