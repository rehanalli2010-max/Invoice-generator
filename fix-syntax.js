const fs = require('fs');

let invoiceJs = fs.readFileSync('js/invoice.js', 'utf8');

// The faulty string block I created
const faultyBlock = `updateItem(itemId, updates) {
        const item = this.items.find(i => String(i.id) === String(itemId));
        if (item) {
            if (updates.description !== undefined) item.description = updates.description;
            if (updates.quantity !== undefined) item.quantity = parseFloat(updates.quantity) || 0;
            if (updates.unitPrice !== undefined) item.unitPrice = parseFloat(updates.unitPrice) || 0;
            if (updates.unit !== undefined) item.unit = updates.unit;
        } else {
            console.warn("Item not found:", itemId);
        }
    } = updates;
            Object.assign(item, safeUpdates);
        }
    }`;

const correctBlock = `updateItem(itemId, updates) {
        const item = this.items.find(i => String(i.id) === String(itemId));
        if (item) {
            if (updates.description !== undefined) item.description = updates.description;
            if (updates.quantity !== undefined) item.quantity = parseFloat(updates.quantity) || 0;
            if (updates.unitPrice !== undefined) item.unitPrice = parseFloat(updates.unitPrice) || 0;
            if (updates.unit !== undefined) item.unit = updates.unit;
        } else {
            console.warn("Item not found:", itemId);
        }
    }`;

invoiceJs = invoiceJs.replace(faultyBlock, correctBlock);
fs.writeFileSync('js/invoice.js', invoiceJs);
