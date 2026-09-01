const fs = require('fs');
const file = 'js/modules/invoice-ui.js';
let content = fs.readFileSync(file, 'utf8');

// we want to add a save button beside the unit price in js/modules/invoice-ui.js
content = content.replace(
    /(\s*<input type="number" class="item-unit-price" value="0" min="0" step="0.01" aria-label="Unit price">)/,
    '$1\n                <button type="button" class="btn btn-secondary btn-sm" onclick="window.app && window.app.savePrice(this, \'${item.id}\')" style="margin-left:5px; padding:2px 5px;" title="Save price for this item">💾</button>'
);

fs.writeFileSync(file, content);
console.log('patched');
