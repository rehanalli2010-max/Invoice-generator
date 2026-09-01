import Invoice from './js/invoice.js';

let app = {
    invoice: new Invoice({ items: [{description: 'A'}] })
};

console.log(typeof app.invoice.addItem);
