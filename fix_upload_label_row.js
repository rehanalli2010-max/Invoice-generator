const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// Replace minmax(120px, 1fr) with minmax(200px, 1fr) for .form-row in style or something?
// No, let's just make companyLogo span the full width too.
content = content.replace('<div class="form-group">\n                                    <label for="companyLogo" data-i18n="invoiceForm.companyLogo">Company Logo (Upload Image)</label>', '<div class="form-group" style="grid-column: 1 / -1;">\n                                    <label for="companyLogo" data-i18n="invoiceForm.companyLogo">Company Logo (Upload Image)</label>');
fs.writeFileSync('index.html', content);
