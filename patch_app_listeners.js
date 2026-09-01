const fs = require('fs');
let code = fs.readFileSync('js/modules/ui.js', 'utf8');
code = code.replace(/input\.closest\('\.items-table'\)/g, "input.closest('.items-list')");
fs.writeFileSync('js/modules/ui.js', code);
console.log("Patched ui.js");
