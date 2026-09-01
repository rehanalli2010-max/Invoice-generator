import Invoice from './js/invoice.js';

const invoice = new Invoice();
console.log("Invoice created:", invoice.items.length);
const item = invoice.addItem('New Item', 1, 0, 'Qty');
console.log("Item added:", item);
invoice.updateItem(item.id, { description: 'New Item', quantity: 1, unitPrice: 200, unit: 'Qty' });
console.log("Item updated:", invoice.items[0]);
try {
    const html = invoice.generateHTML();
    console.log(invoice.items[0]); console.log("HTML generated successfully! Contains 200.00:", html.includes('200.00'));
} catch (e) {
    console.error("Error generating HTML:", e);
}
