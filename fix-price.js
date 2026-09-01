const fs = require('fs');

let uiJs = fs.readFileSync('js/modules/ui.js', 'utf8');

// Add change listener to itemsTableBody to catch spinner arrows
if (!uiJs.includes("document.getElementById('itemsTableBody').addEventListener('change',")) {
    uiJs = uiJs.replace(
        /document\.getElementById\('itemsTableBody'\)\.addEventListener\('input', \(e\) => {/,
        `document.getElementById('itemsTableBody').addEventListener('change', (e) => {
        if (e.target.matches('.item-description, .item-quantity, .item-unit-price, .item-unit')) {
            this.updateItemFromRow(e.target);
        }
    });

    document.getElementById('itemsTableBody').addEventListener('input', (e) => {`
    );
    fs.writeFileSync('js/modules/ui.js', uiJs);
    console.log('ui.js patched');
}

let invUiJs = fs.readFileSync('js/modules/invoice-ui.js', 'utf8');

// Robust parsing of quantity and unit price, replacing commas
invUiJs = invUiJs.replace(
    /const quantity = parseFloat\(row\.querySelector\('\.item-quantity'\)\.value\) \|\| 0;/g,
    `const quantityVal = row.querySelector('.item-quantity').value; const quantity = parseFloat(String(quantityVal).replace(',', '.')) || 0;`
);
invUiJs = invUiJs.replace(
    /const unitPrice = parseFloat\(row\.querySelector\('\.item-unit-price'\)\.value\) \|\| 0;/g,
    `const unitPriceVal = row.querySelector('.item-unit-price').value; const unitPrice = parseFloat(String(unitPriceVal).replace(',', '.')) || 0;`
);

fs.writeFileSync('js/modules/invoice-ui.js', invUiJs);
console.log('invoice-ui.js patched');
