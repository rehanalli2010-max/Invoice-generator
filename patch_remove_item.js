const fs = require('fs');
let file = fs.readFileSync('js/modules/invoice-ui.js', 'utf8');

const targetStr = `this.invoice.removeItem(itemId);`;

if (file.includes(targetStr)) {
    const replacement = `
    if (!this.invoice || typeof this.invoice.removeItem !== 'function') {
        if (this.invoice) {
            Object.setPrototypeOf(this.invoice, Invoice.prototype);
        }
    }
    this.invoice.removeItem(itemId);`;

    file = file.replace(targetStr, replacement.trim());
    fs.writeFileSync('js/modules/invoice-ui.js', file);
    console.log("Applied defense fix to removeItem");
} else {
    console.error("Target string not found for removeItem!");
}
