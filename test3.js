const fs = require('fs');

global.localStorage = {
    getItem: (key) => null
};
let mydom;

const dom = require('jsdom');
const { JSDOM } = dom;

const Invoice = require('./js/invoice.js').default || require('./js/invoice.js');

let invoice = new Invoice();
invoice.addItem('Item 1', 1, 100, 'Qty');
invoice.addItem('Item 2', 2, 200, 'Qty');

console.log(invoice.generateHTML().includes('Item 2'));
console.log(invoice.generateHTML().match(/<tr>/g).length);
