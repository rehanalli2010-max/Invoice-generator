const fs = require('fs');
let content = fs.readFileSync('D:/CODE/Invoice generator/js/invoice.js', 'utf8');

content = content.replace("import { escapeHtml: escapeHtmlUtil, sanitizeUrl: sanitizeUrlUtil", "import { escapeHtml as escapeHtmlUtil, sanitizeUrl as sanitizeUrlUtil");
fs.writeFileSync('D:/CODE/Invoice generator/js/invoice.js', content);
console.log('Fixed import alias');
