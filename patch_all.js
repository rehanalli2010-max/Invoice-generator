const fs = require('fs');

const files = [
  'js/modules/invoice-ui.js',
  'test_server/js/modules/invoice-ui.js',
  'test_server2/js/modules/invoice-ui.js'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let src = fs.readFileSync(file, 'utf8');

    src = src.replace(/const readValues = \(\) => {[\s\S]*?this\.invoice\.updateItem\(itemId, { description, quantity: parsedQuantity, unitPrice: parsedUnitPrice, unit }\);/m, `const readValues = () => {
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

        this.invoice.updateItem(itemId, { description: descriptionValue, quantity: parsedQuantity, unitPrice: parsedUnitPrice, unit });`);

    fs.writeFileSync(file, src);
  }
}
