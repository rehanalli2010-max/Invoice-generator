const fs = require('fs');

let file = fs.readFileSync('js/modules/invoice-ui.js', 'utf8');

const targetStr = `const item = this.invoice.addItem('New Item', 1, 0, 'Qty');`;

if (file.includes(targetStr)) {
    const replacement = `
    // Ensure invoice is a proper Invoice instance that has .addItem method
    if (!this.invoice || typeof this.invoice.addItem !== 'function') {
        if (this.invoice) {
            // Restore prototype to fix "addItem is not a function"
            Object.setPrototypeOf(this.invoice, Invoice.prototype);
        } else {
            this.invoice = new Invoice();
        }
    }
    const item = this.invoice.addItem('New Item', 1, 0, 'Qty');`;

    file = file.replace(targetStr, replacement.trim());
    fs.writeFileSync('js/modules/invoice-ui.js', file);
    
    console.log("Applied defense fix to addItem");
} else {
    console.error("Target string not found in invoice-ui.js!");
}
