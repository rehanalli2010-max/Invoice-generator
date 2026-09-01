const fs = require('fs');
let content = fs.readFileSync('js/modules/templates.js', 'utf8');
content = content.replace(/this\.deleteTemplateHandler\(\)/g, "window.app.deleteTemplateHandler()");
// Check if "this.token" inside deleteTemplateHandler was replaced by previous script (it was not)
content = content.replace(/if \(this\.token\)/g, "if (window.app.token)");
content = content.replace(/this\.apiDeleteCompanyTemplate/g, "window.app.apiDeleteCompanyTemplate");
content = content.replace(/this\.showNotification/g, "window.app.showNotification");
content = content.replace(/this\.renderTemplateList/g, "window.app.renderTemplateList");
content = content.replace(/this\.storage\.deleteCompanyTemplate/g, "window.app.storage.deleteCompanyTemplate");
fs.writeFileSync('js/modules/templates.js', content, 'utf8');
