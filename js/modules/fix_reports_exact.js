const fs = require('fs');
let code = fs.readFileSync('D:/CODE/Invoice generator/js/modules/reports.js', 'utf8');

// Replace literal `\` followed by `` ` `` with just `` ` ``
code = code.replace(/\`/g, '`');

// Replace literal `\` followed by `$` with just `$`
code = code.replace(/\\$/g, '$');

// Re-write to double check
fs.writeFileSync('D:/CODE/Invoice generator/js/modules/reports.js', code);
console.log('Fixed reports.js');
