const fs = require('fs');

let code = fs.readFileSync('js/modules/invoice-ui.js', 'utf8');

// Ensure addItem forces a preview update and log to console if it doesn't
code = code.replace(
    /if \(!this\._suppressPreview\) this\.updatePreview\(\);\s*\}/,
    `if (!this._suppressPreview) {\n        console.log("Forcing preview update inside addItem");\n        this.updatePreview();\n    }\n}`
);

// Ensure updateItemAmount updates preview? 
// No, updateItemAmount shouldn't update preview natively to avoid double render, but updateItemFromRow already does. 

fs.writeFileSync('js/modules/invoice-ui.js', code);
console.log("Applied fix");
