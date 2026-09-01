const fs = require('fs');
let code = fs.readFileSync('D:/CODE/Invoice generator/js/modules/reports.js', 'utf8');

// The file contains literally the two characters '\' and '`'.
// To match '\', we use '\' in string form.
code = code.split('\`').join('`');
code = code.split('\$').join('$');

fs.writeFileSync('D:/CODE/Invoice generator/js/modules/reports.js', code);
console.log('Fixed for real');
