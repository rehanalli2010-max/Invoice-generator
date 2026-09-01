const fs = require('fs');
let code = fs.readFileSync('js/modules/invoice-ui.js', 'utf8');
code = code.replace(
    'this.updatePreview();\n    console.log("Updated item from row:", unitPrice, itemId, JSON.stringify(this.invoice.items));',
    'this.updatePreview();'
);
fs.writeFileSync('js/modules/invoice-ui.js', code);
