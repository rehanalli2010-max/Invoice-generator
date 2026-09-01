const fs = require('fs');
let content = fs.readFileSync('js/app.js', 'utf8');

// Also manually init dashboard view if it's the root hash currently
content = content.replace(
    /if \(window\.location\.hash === '#invoice'\) {\s*app\.showInvoiceView\(\);\s*}/,
    "if (window.location.hash === '#invoice') {\n        app.showInvoiceView();\n    } else {\n        app.showDashboardView();\n    }"
);

fs.writeFileSync('js/app.js', content);
console.log("Updated js/app.js startApp procedure");
