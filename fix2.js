const fs = require('fs');
let code = fs.readFileSync('js/modules/invoice-ui.js', 'utf8');

const target = `    const saveBtn = document.querySelectorAll('.form-actions button')[1]; // Save invoice button is the second one now
    const originalText = saveBtn ? saveBtn.innerHTML : '';`;
    
const repl = `    const saveBtn = btnEvent ? btnEvent.currentTarget : document.querySelector('.form-actions button');
    const originalText = saveBtn ? saveBtn.innerHTML : '';`;

code = code.replace(target, repl);
fs.writeFileSync('js/modules/invoice-ui.js', code);
console.log('Fixed btn query');
