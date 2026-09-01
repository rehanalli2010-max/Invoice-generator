/**
 * Product / Service Catalog Module
 * Lets users keep a reusable list of items and drop them onto the invoice.
 */

import { escapeHtml } from '../utils.js';

function getProducts() {
    return this.token ? (this.apiProducts || []) : (this.storage.getProducts ? this.storage.getProducts() : []);
}

export async function showProductCatalog() {
    const modal = document.getElementById('productCatalogModal');
    if (!modal) return;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    if (window._focusModal) window._focusModal(modal);
    await this.renderProductCatalog();
}

export function closeProductCatalog() {
    const modal = document.getElementById('productCatalogModal');
    if (modal) {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
    }
}

export async function renderProductCatalog() {
    const listEl = document.getElementById('productCatalogList');
    if (!listEl) return;
    const products = getProducts.call(this);
    const t = (k, fallback) => typeof i18n !== 'undefined' ? i18n.t(k, fallback) : (fallback || k);

    if (products.length === 0) {
        listEl.innerHTML = `<p style="padding: 1.5rem; text-align: center; color: var(--text-muted);">${t('products.empty', 'No saved items yet')}</p>`;
        return;
    }

    listEl.innerHTML = products.map(p => {
        const price = (p.unit_price != null ? p.unit_price : 0);
        return `
        <div class="product-catalog-row" style="display:flex; align-items:center; gap:0.75rem; padding:0.75rem 0; border-bottom:1px solid var(--border);">
            <div style="flex:1; min-width:0;">
                <strong style="color:var(--text-main);">${escapeHtml(p.name)}</strong>
                ${p.description ? `<div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.2rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(p.description)}</div>` : ''}
                <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.2rem;">${escapeHtml(p.currency || 'USD')} ${Number(price).toFixed(2)}${p.tax_rate ? ' · ' + Number(p.tax_rate) + '% tax' : ''}</div>
            </div>
            <button class="btn btn-primary btn-sm" data-action="add" data-product-id="${escapeHtml(p.id)}">${t('products.add', 'Add')}</button>
            <button class="btn btn-danger btn-sm" data-action="delete" data-product-id="${escapeHtml(p.id)}" aria-label="Delete item">🗑️</button>
        </div>`;
    }).join('');

    if (!listEl._productsDelegated) {
        listEl._productsDelegated = true;
        listEl.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn || !window.app) return;
            const id = btn.dataset.productId;
            const action = btn.dataset.action;
            if (action === 'add') window.app.addProductToInvoice(id);
            else if (action === 'delete') window.app.deleteProductById(id);
        });
    }
}

export function addProductToInvoice(productId) {
    const products = getProducts.call(this);
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (typeof this.addItem !== 'function') return;
    this.addItem({
        description: product.name + (product.description ? ' — ' + product.description : ''),
        quantity: 1,
        unitPrice: product.unit_price != null ? product.unit_price : 0,
        unit: 'Qty'
    });
    // Apply the product's tax rate to the invoice if the invoice tax is unset
    if (product.tax_rate && (!this.invoice.taxRate || this.invoice.taxRate === 0) && this.invoice.taxType !== 'percentage') {
        const taxTypeEl = document.getElementById('taxType');
        const taxRateEl = document.getElementById('taxRate');
        if (taxTypeEl) taxTypeEl.value = 'percentage';
        if (taxRateEl) taxRateEl.value = product.tax_rate;
        this.invoice.taxType = 'percentage';
        this.invoice.taxRate = parseFloat(product.tax_rate) || 0;
        this.updateTaxDisplay && this.updateTaxDisplay();
        this.updateTotals && this.updateTotals();
    }
    this.showNotification('Item added to invoice', 'success');
}

export async function saveCurrentItemToCatalog(itemId) {
    const row = document.querySelector(`div[data-item-id="${CSS.escape(itemId)}"]`);
    if (!row) return;
    const description = row.querySelector('.item-description')?.value.trim();
    const unitPrice = parseFloat(row.querySelector('.item-unit-price')?.value) || 0;
    if (!description) {
        this.showNotification('Enter a description before saving to catalog', 'error');
        return;
    }
    const data = {
        name: description,
        description: '',
        unitPrice,
        taxRate: this.invoice && this.invoice.taxType === 'percentage' ? (this.invoice.taxRate || 0) : 0,
        currency: this.invoice ? (this.invoice.currency || 'USD') : 'USD'
    };
    try {
        if (this.token) {
            await this.apiSaveProduct(data);
            await this.apiGetProducts();
        } else {
            this.storage.saveProduct(data);
        }
        this.showNotification('Saved to catalog', 'success');
    } catch (err) {
        this.showNotification(err.message || 'Failed to save item', 'error');
    }
}

export async function deleteProductById(productId) {
    try {
        if (this.token) {
            await this.apiDeleteProduct(productId);
            await this.renderProductCatalog();
        } else {
            this.storage.deleteProduct(productId);
            await this.renderProductCatalog();
        }
    } catch {
        this.showNotification('Failed to delete item', 'error');
    }
}

export function renderSavedProductsDropdown() {
    const select = document.getElementById('savedProducts');
    if (!select) return;
    const products = getProducts.call(this);
    const t = (k, fallback) => typeof i18n !== 'undefined' ? i18n.t(k, fallback) : (fallback || k);
    select.innerHTML = `<option value="">${t('products.select', 'Select saved item…')}</option>`;
    products.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        select.appendChild(opt);
    });
    const container = select.closest('.custom-select');
    if (container) {
        const valueEl = container.querySelector('.custom-select-value');
        if (valueEl) valueEl.textContent = t('products.select', 'Select saved item…');
    }
}

export function addProductFromSaved(productId) {
    if (!productId) return;
    this.addProductToInvoice(productId);
    this.renderSavedProductsDropdown();
}
