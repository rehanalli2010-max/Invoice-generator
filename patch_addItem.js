const fs = require('fs');

let invoiceJs = fs.readFileSync('js/modules/invoice-ui.js', 'utf8');

invoiceJs = invoiceJs.replace(
    /tbody\.appendChild\(row\);\s*this\.updateItemAmount\(row\);\s*\}/,
    `tbody.appendChild(row);\n    this.updateItemAmount(row);\n    if (!this._suppressPreview) this.updatePreview();\n}`
);

fs.writeFileSync('js/modules/invoice-ui.js', invoiceJs);
console.log("Patched addItem");
