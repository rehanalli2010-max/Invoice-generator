const fs = require('fs');
let code = fs.readFileSync('js/modules/history.js', 'utf8');

code = code.replace(
    "const statusClass = status === 'Paid' ? 'status-paid'",
    "const statusClass = (status === 'Paid' || status === 'Completed') ? 'status-paid'"
);

fs.writeFileSync('js/modules/history.js', code);
console.log('Fixed history.js');
