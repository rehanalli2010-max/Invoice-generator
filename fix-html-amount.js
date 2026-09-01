const fs = require('fs');

const jsFile = 'js/modules/invoice-ui.js';
let jsContent = fs.readFileSync(jsFile, 'utf8');

jsContent = jsContent.replace(/<span class="item-amount">/g, '<div class="item-amount">');
jsContent = jsContent.replace(/<\/span>\s*<\/div>\s*<button type="button" class="remove-item-btn"/g, '</div>\n            </div>\n            <button type="button" class="remove-item-btn"');


fs.writeFileSync(jsFile, jsContent, 'utf8');
console.log('Fixed HTML for .item-amount in JS.');
