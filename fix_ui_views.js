const fs = require('fs');

let ui = fs.readFileSync('js/modules/ui.js', 'utf8');

ui = ui.replace(
    /const views = \['home', 'new-invoice', 'history', 'clients', 'pricing'\];/g,
    "const views = ['home', 'new-invoice', 'history', 'clients', 'templates', 'pricing'];"
);

fs.writeFileSync('js/modules/ui.js', ui);
console.log("Updated views array");
