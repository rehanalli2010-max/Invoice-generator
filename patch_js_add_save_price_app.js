const fs = require('fs');
const file = 'js/app.js';
let content = fs.readFileSync(file, 'utf8');

// Also expose it on window.app / app class
if (!content.includes('savePrice(target, itemId)')) {
    content = content.replace(
        /export default class App \{/,
        'export default class App {\n    savePrice(target, itemId) {\n        const row = target.closest(\'.item-row\');\n        let desc = \'Unknown item\';\n        let price = 0;\n        if(row) {\n            desc = row.querySelector(\'.item-description\').value;\n            price = parseFloat(row.querySelector(\'.item-unit-price\').value) || 0;\n        }\n        if(desc && price > 0) {\n            // let\'s just use the PricingService or basic localStorage logic\n            const savedPrices = JSON.parse(localStorage.getItem(\'savedPrices\') || \'{}\');\n            savedPrices[desc] = {\n                price: price,\n                updatedAt: new Date().toISOString()\n            };\n            localStorage.setItem(\'savedPrices\', JSON.stringify(savedPrices));\n            this.showNotification(`Saved price for ${desc}: ${price}`, \'success\');\n        } else {\n           this.showNotification(`Cannot save invalid price`, \'error\');\n        }\n    }\n'
    );
    fs.writeFileSync(file, content);
    console.log('patched app.js - added savePrice');
}

