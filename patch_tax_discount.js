const fs = require('fs');

let appJs = fs.readFileSync('js/app.js', 'utf8');

appJs = appJs.replace(
    /taxRateInput\.placeholder = taxType === 'percentage' \? '0-100' : '0';\s*\}/,
    "taxRateInput.placeholder = taxType === 'percentage' ? '0-100' : '0';\n        }\n        this.updateTotals();"
);

appJs = appJs.replace(
    /discountInput\.placeholder = discountType === 'percentage' \? '0-100' : '0';\s*\}/,
    "discountInput.placeholder = discountType === 'percentage' ? '0-100' : '0';\n        }\n        this.updateTotals();"
);

fs.writeFileSync('js/app.js', appJs);
console.log("Patched");
