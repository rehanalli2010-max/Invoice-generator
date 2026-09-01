const fs = require('fs');
global.i18n = { t: (key) => key }; // mock i18n
global.localStorage = {
    getItem: (key) => null
};
global.crypto = { randomUUID: () => Math.random().toString() }; // mock crypto

const Invoice = require('./js/invoice.js').default || require('./js/invoice.js');

let invoice = new Invoice();
invoice.addItem('Item 1', 1, 100, 'Qty');
invoice.addItem('Item 2', 1, 100, 'Qty');

const html = invoice.generateHTML();
console.log(html.includes('Item 2'));
const matches = html.match(/<td class="item-desc"/g);
console.log(matches ? matches.length : 0);
