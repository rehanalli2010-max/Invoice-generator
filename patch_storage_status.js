const fs = require('fs');
let code = fs.readFileSync('js/storage.js', 'utf8');

code = code.replace(
    /if \(invoice\.status === 'completed' \|\| invoice\.status === 'paid'\) return 'Completed';/,
    `if (invoice.status === 'completed' || invoice.status === 'paid') return 'Paid';
        if (invoice.status === 'draft') return 'Draft';`
);

fs.writeFileSync('js/storage.js', code);
