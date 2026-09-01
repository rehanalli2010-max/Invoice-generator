const fs = require('fs');
const file = 'js/app.js';
let content = fs.readFileSync(file, 'utf8');

// We see 'app' is an object not a class: `const app = {`
// Let's patch it.

if (!content.includes('savePrice:')) {
    content = content.replace(
        /const app = \{/,
        'const app = {\n    savePrice(target, itemId) {\n        const row = target.closest(\'.item-row\');\n        let desc = \'Unknown item\';\n        let price = 0;\n        if(row) {\n            desc = row.querySelector(\'.item-description\').value;\n            price = parseFloat(row.querySelector(\'.item-unit-price\').value) || 0;\n        }\n        if(desc && price > 0) {\n            // Use standard localStorage or whatever storage you prefer\n            const savedPricesStr = localStorage.getItem(\'savedPrices\');\n            const savedPrices = savedPricesStr ? JSON.parse(savedPricesStr) : {};\n            savedPrices[desc] = {\n                price: price,\n                updatedAt: new Date().toISOString()\n            };\n            localStorage.setItem(\'savedPrices\', JSON.stringify(savedPrices));\n            this.showNotification(`Saved price for ${desc}: $${price}`, \'success\');\n        } else {\n           this.showNotification(`Cannot save invalid price`, \'error\');\n        }\n    },'
    );
    fs.writeFileSync(file, content);
    console.log('patched app.js - added savePrice into const app');
}

