const fs = require('fs');
let code = fs.readFileSync('D:/CODE/Invoice generator/js/modules/reports.js', 'utf8');

// The string literal has backslashes before backticks and dollar signs. 
// e.g. \` \${c.label}
code = code.split('\`').join('`');
code = code.split('\${').join('${');

fs.writeFileSync('D:/CODE/Invoice generator/js/modules/reports.js', code);
console.log('Fixed reports.js securely');
