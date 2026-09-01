/**
 * Invoice Form UI Module
 * Handles invoice form interactions, items, preview, and form operations
 */

import Invoice from '../invoice.js';

export function addItem() {
    const item = this.invoice.addItem('New Item', 1, 0, 'Qty');
    const tbody = document.getElementById('itemsTableBody');
    const row = document.createElement('tr');
    row.className = 'row-enter';
    row.dataset.itemId = item.id;
    row.innerHTML = `
        <td data-label="Description"><input type="text" class="item-description" value="New Item" placeholder="Description" aria-label="Item description"></td>
        <td data-label="Unit"><input type="text" class="item-unit" value="Qty" placeholder="Unit" aria-label="Unit"></td>
        <td data-label="Quantity"><input type="number" class="item-quantity" value="1" min="0" step="any" aria-label="Quantity"></td>
        <td data-label="Unit Price"><input type="number" class="item-unit-price" value="0" min="0" step="0.01" aria-label="Unit price"></td>
        <td data-label="Amount" class="item-amount">$0.00</td>
        <td><button type="button" class="remove-item-btn" onclick="app.removeItem('${item.id}')" aria-label="Remove item">&times;</button></td>
    `;
    tbody.appendChild(row);
    this.updateItemAmount(row);
}

export function removeItem(itemId) {
    if (this.invoice.items && this.invoice.items.length <= 1) {
        this.showNotification('Cannot remove the last item', 'error');
        return;
    }
    this.invoice.removeItem(itemId);
    const row = document.querySelector(`tr[data-item-id="${itemId}"]`);
    if (row) row.remove();
    this.updatePreview();
}

export function updateItemFromRow(target) {
    const row = target.closest('tr');
    if (!row) return;
    const itemId = row.dataset.itemId;
    const description = row.querySelector('.item-description').value;
    const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
    const unitPrice = parseFloat(row.querySelector('.item-unit-price').value) || 0;
    const unit = row.querySelector('.item-unit').value || 'Qty';

    if (quantity < 0 || unitPrice < 0) {
        this.showNotification('Quantity and price cannot be negative', 'error');
        row.querySelector('.item-quantity').value = Math.max(0, quantity);
        row.querySelector('.item-unit-price').value = Math.max(0, unitPrice);
        return;
    }

    this.invoice.updateItem(itemId, { description, quantity, unitPrice, unit });
    this.updateItemAmount(row);
    this.updatePreview();
}

export function updateItemAmount(row) {
    const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
    const unitPrice = parseFloat(row.querySelector('.item-unit-price').value) || 0;
    const amount = quantity * unitPrice;
    const symbol = this.invoice.getCurrencySymbol();
    row.querySelector('.item-amount').textContent = symbol + amount.toFixed(2);
}

export function loadInvoice(data) {
    this.invoice = new Invoice(data);
    document.getElementById('companyName').value = data.companyName || '';
    document.getElementById('companyEmail').value = data.companyEmail || '';
    document.getElementById('companyPhone').value = data.companyPhone || '';
    document.getElementById('companyAddress').value = data.companyAddress || '';
    if (data.companyLogo) {
        document.getElementById('companyLogoBase64').value = data.companyLogo;
    } else {
        document.getElementById('companyLogoBase64').value = '';
    }
    document.getElementById('clientName').value = data.clientName || '';
    document.getElementById('clientEmail').value = data.clientEmail || '';
    document.getElementById('clientPhone').value = data.clientPhone || '';
    document.getElementById('clientAddress').value = data.clientAddress || '';
    document.getElementById('invoiceNumber').value = data.invoiceNumber || '';
    document.getElementById('invoiceDate').value = data.invoiceDate || '';
    document.getElementById('dueDate').value = data.dueDate || '';
    document.getElementById('currency').value = data.currency || 'USD';
    document.getElementById('paymentTerms').value = data.paymentTerms || 'Net 30';
    document.getElementById('notes').value = data.notes || '';
    document.getElementById('documentType').value = data.documentType || 'Invoice';
    document.getElementById('paymentLink').value = data.paymentLink || '';
    document.getElementById('recurringType').value = data.recurring || 'none';
    document.getElementById('taxType').value = data.taxType || 'none';
    document.getElementById('taxRate').value = data.taxRate || 0;
    document.getElementById('discountType').value = data.discountType || 'none';
    document.getElementById('discountValue').value = data.discountValue || 0;

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
            const row = document.createElement('tr');
            row.className = 'row-enter';
            row.dataset.itemId = item.id;
            row.innerHTML = `
                <td data-label="Description"><input type="text" class="item-description" value="${this.invoice.escapeHtml(item.description || '')}" placeholder="Description" aria-label="Item description"></td>
                <td data-label="Unit"><input type="text" class="item-unit" value="${this.invoice.escapeHtml(item.unit || 'Qty')}" placeholder="Unit" aria-label="Unit"></td>
                <td data-label="Quantity"><input type="number" class="item-quantity" value="${item.quantity || 0}" min="0" step="any" aria-label="Quantity"></td>
                <td data-label="Unit Price"><input type="number" class="item-unit-price" value="${item.unitPrice || 0}" min="0" step="0.01" aria-label="Unit price"></td>
                <td data-label="Amount" class="item-amount">${this.invoice.getCurrencySymbol()}${((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toFixed(2)}</td>
                <td><button type="button" class="remove-item-btn" onclick="app.removeItem('${item.id}')" aria-label="Remove item">&times;</button></td>
            `;
            tbody.appendChild(row);
        });
    }
    this.updatePreview();
}

export function loadLastDraft() {
    const invoices = this.storage.getInvoices();
    if (invoices.length > 0) {
        const lastInvoice = invoices[invoices.length - 1];
        if (this.isFormDirty()) {
            this.showConfirm(`A saved invoice draft (#${lastInvoice.invoiceNumber}) is available. Do you want to load it? Warning: This will overwrite your current unsaved changes.`).then(confirmed => {
                if (confirmed) this.loadInvoice(lastInvoice);
            });
        } else {
            this.showConfirm(`Load your last saved invoice draft (#${lastInvoice.invoiceNumber})?`).then(confirmed => {
                if (confirmed) this.loadInvoice(lastInvoice);
            });
        }
    }
}

export async function saveDraft() {
    this.updateInvoiceFromForm();
    if (!this.validateForm(true)) {
         this.showNotification('Please fill in the invoice number', 'error');
         return;
    }
    const validation = this.invoice.validate(true);
    if (!validation.isValid) {
        this.showNotification(`Please fix errors:\n${validation.errors.join('\n')}`, 'error');
        return;
    }
    if (!this.invoice.id) this.invoice.id = crypto.randomUUID();

    const saveBtn = document.querySelector('.form-actions .btn-primary');
    const originalText = saveBtn ? saveBtn.innerHTML : '';
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner"></span>';
        saveBtn.classList.add('btn-loading');
    }

    const json = this.invoice.toJSON();
    try {
        if (this.token) {
            const result = await this.apiSaveInvoice(json);
            if (!result) {
                this.showNotification('Failed to save draft', 'error');
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
                this.showNotification('Failed to save draft', 'error');
                return;
            }
        }
        this.showNotification('Draft saved successfully', 'success');
        if (this.showTypewriter) {
            this.showTypewriter('Invoice Saved', { typingSpeed: 45 });
        }
        this.showMigrationPrompt();
    } catch (err) {
        this.showNotification(err.message || 'Failed to save draft', 'error');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
            saveBtn.classList.remove('btn-loading');
        }
    }
}

export function resetForm() {
    this.showConfirm('Are you sure you want to reset the form? All unsaved changes will be lost.').then(confirmed => {
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

            this.invoice = new Invoice();
            this.clearSignature();
            document.getElementById('itemsTableBody').innerHTML = '';
            this.addItem();
            this.setTodayDates();
            this.updateTaxDisplay();
            this.updateDiscountDisplay();
            this.syncCustomSelects();
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
    this.invoice.taxType = document.getElementById('taxType').value;
    this.invoice.taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
    this.invoice.discountType = document.getElementById('discountType').value;
    this.invoice.discountValue = parseFloat(document.getElementById('discountValue').value) || 0;
    this.updatePreview();
}

export function updateInvoiceFromForm() {
    try {
        this.invoice.companyName = document.getElementById('companyName').value;
        this.invoice.companyEmail = document.getElementById('companyEmail').value;
        this.invoice.companyPhone = document.getElementById('companyPhone').value;
        this.invoice.companyAddress = document.getElementById('companyAddress').value;
        this.invoice.companyLogo = document.getElementById('companyLogoBase64') ? document.getElementById('companyLogoBase64').value : '';

        this.invoice.clientName = document.getElementById('clientName').value;
        this.invoice.clientEmail = document.getElementById('clientEmail').value;
        this.invoice.clientPhone = document.getElementById('clientPhone').value;
        this.invoice.clientAddress = document.getElementById('clientAddress').value;

        this.invoice.invoiceNumber = document.getElementById('invoiceNumber').value;
        this.invoice.invoiceDate = document.getElementById('invoiceDate').value;
        this.invoice.dueDate = document.getElementById('dueDate').value;
        this.invoice.currency = document.getElementById('currency').value;
        this.invoice.paymentTerms = document.getElementById('paymentTerms').value;
        this.invoice.notes = document.getElementById('notes').value;

        this.invoice.documentType = document.getElementById('documentType').value;
        this.invoice.paymentLink = document.getElementById('paymentLink').value;
        this.invoice.recurring = document.getElementById('recurringType').value;

        this.invoice.taxType = document.getElementById('taxType').value;
        this.invoice.taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
        this.invoice.discountType = document.getElementById('discountType').value;
        this.invoice.discountValue = parseFloat(document.getElementById('discountValue').value) || 0;

        this.updateTotals();
    } catch (e) {
        this.showNotification(`Error updating invoice: ${e.message}`, 'error');
    }
}
