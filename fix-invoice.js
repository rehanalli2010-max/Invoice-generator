const fs = require('fs');

// 1. Fix invoice.js
let invoiceJs = fs.readFileSync('js/invoice.js', 'utf8');
// Fix updateItem to be more resilient
invoiceJs = invoiceJs.replace(
    /updateItem\(itemId, updates\) {[\s\S]*?}/,
    `updateItem(itemId, updates) {
        const item = this.items.find(i => String(i.id) === String(itemId));
        if (item) {
            if (updates.description !== undefined) item.description = updates.description;
            if (updates.quantity !== undefined) item.quantity = parseFloat(updates.quantity) || 0;
            if (updates.unitPrice !== undefined) item.unitPrice = parseFloat(updates.unitPrice) || 0;
            if (updates.unit !== undefined) item.unit = updates.unit;
        } else {
            console.warn("Item not found:", itemId);
        }
    }`
);
fs.writeFileSync('js/invoice.js', invoiceJs);

// 2. Fix invoice-ui.js
let uiJs = fs.readFileSync('js/modules/invoice-ui.js', 'utf8');
// Update addItem to use setAttribute just in case
uiJs = uiJs.replace(
    `row.dataset.itemId = item.id;`,
    `row.setAttribute('data-item-id', item.id); row.dataset.itemId = item.id;`
);
// Update loadInvoice to use setAttribute
uiJs = uiJs.replace(
    `row.dataset.itemId = item.id;`,
    `row.setAttribute('data-item-id', item.id); row.dataset.itemId = item.id;`
);
// Update updateItemFromRow to use getAttribute
uiJs = uiJs.replace(
    `const itemId = row.dataset.itemId;`,
    `const itemId = row.getAttribute('data-item-id') || row.dataset.itemId;`
);

// Ensure unit price parsing works
uiJs = uiJs.replace(
    `const unitPrice = parseFloat(row.querySelector('.item-unit-price').value) || 0;`,
    `const unitPrice = parseFloat(row.querySelector('.item-unit-price').value) || 0;`
);

fs.writeFileSync('js/modules/invoice-ui.js', uiJs);
