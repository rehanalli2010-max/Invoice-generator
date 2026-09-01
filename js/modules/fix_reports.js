const fs = require('fs');
let content = fs.readFileSync('D:/CODE/Invoice generator/js/modules/reports.js', 'utf8');

content = content.replace(/\`/g, '`').replace(/\\$/g, '$');
fs.writeFileSync('D:/CODE/Invoice generator/js/modules/reports.js', content);
console.log('Fixed reports.js');
