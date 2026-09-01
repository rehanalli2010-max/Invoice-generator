const fs = require('fs');

let file = fs.readFileSync('js/modules/invoice-ui.js', 'utf8');
file = file.replace(
    "const item = this.invoice.addItem('New Item', 1, 0, 'Qty');",
    `
    console.log("Diagnostic this.invoice:", this.invoice);
    console.log("Diagnostic this:", this);
    if (typeof this.invoice.addItem !== 'function') {
        console.error("this.invoice HAS NO addItem! Is it plain? Prototype:", Object.getPrototypeOf(this.invoice));
        // Fallback fix if it's a plain object but we have Invoice constructor
        if (!this.invoice.addItem) {
            Object.setPrototypeOf(this.invoice, Invoice.prototype);
        }
    }
    const item = this.invoice.addItem('New Item', 1, 0, 'Qty');
    `
);

fs.writeFileSync('js/modules/invoice-ui.js', file);
