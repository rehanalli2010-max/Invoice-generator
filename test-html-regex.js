const Invoice = require('./js/invoice.js').default || require('./js/invoice.js');
let invoice = new Invoice();
global.i18n = { t: key => key };
global.localStorage = { getItem: () => null };

invoice.items = [
  { id: '1', description: 'New Item', quantity: 1, unitPrice: 100, unit: 'Qty' },
  { id: '2', description: 'New Item', quantity: 1, unitPrice: 200, unit: 'Qty' }
];

console.log(invoice.generateHTML().includes('New Item'));
console.log(invoice.generateHTML().split('<tr>').length - 1);
