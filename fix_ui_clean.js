const fs = require('fs');

let file = fs.readFileSync('js/modules/invoice-ui.js', 'utf8');

const regex = /export function addItem\(\) \{[\s\S]*?(const item = this\.invoice\.addItem\('New Item', 1, 0, 'Qty'\);)/;

const cleanReplacement = `export function addItem() {
    if (!this.invoice || typeof this.invoice.addItem !== 'function') {
        if (this.invoice) {
            Object.setPrototypeOf(this.invoice, Invoice.prototype);
        } else {
            this.invoice = new Invoice();
        }
    }
    $1`;

file = file.replace(regex, cleanReplacement);
fs.writeFileSync('js/modules/invoice-ui.js', file);
console.log("Cleaned up invoice-ui.js addItem");
