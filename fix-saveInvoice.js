const fs = require('fs');
let code = fs.readFileSync('js/modules/invoice-ui.js', 'utf8');

code = code.replace(
    /const saveBtn = document\.querySelectorAll\('\.form-actions button'\)\[1\]; \/\/ Save invoice button is the second one now\n\s*const originalText = saveBtn \? saveBtn\.innerHTML : '';/g,
    "const saveBtn = btnEvent && btnEvent.currentTarget ? btnEvent.currentTarget : document.querySelector('.form-actions button');\n    const originalText = saveBtn ? saveBtn.innerHTML : '';"
);

code = code.replace(
    /this\.invoice\.status = status;/g,
    "this.invoice.status = status;\n    this.updatePreview(); // update preview before saving (to reflect status)"
)

fs.writeFileSync('js/modules/invoice-ui.js', code);
console.log('Fixed invoice-ui.js correctly');
