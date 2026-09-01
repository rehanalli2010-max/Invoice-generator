const fs = require('fs');

let content = fs.readFileSync('js/modules/templates.js', 'utf8');

// Replace all isolated 'this.' with 'window.app.' inside the event listener setup
content = content.replace(/this\.openTemplateModal\(\)/g, "window.app.openTemplateModal()");
content = content.replace(/this\.closeTemplateModal\(\)/g, "window.app.closeTemplateModal()");
content = content.replace(/this\.saveTemplateHandler\(\)/g, "window.app.saveTemplateHandler()");
content = content.replace(/this\.searchTemplates\(/g, "window.app.searchTemplates(");
content = content.replace(/this\.renderTemplateList\(\)/g, "window.app.renderTemplateList()");

// In renderTemplateList
content = content.replace(/this\.token/g, "window.app.token");
content = content.replace(/this\.user/g, "window.app.user");
content = content.replace(/this\.apiGetCompanyTemplates/g, "window.app.apiGetCompanyTemplates");
content = content.replace(/this\.storage/g, "window.app.storage");

// In searchTemplates - Nothing

// In saveTemplateHandler
content = content.replace(/this\.openPortal/g, "window.app.openPortal");
content = content.replace(/this\.apiDeleteCompanyTemplate/g, "window.app.apiDeleteCompanyTemplate");
content = content.replace(/this\.apiSaveCompanyTemplate/g, "window.app.apiSaveCompanyTemplate");
content = content.replace(/this\.showNotification/g, "window.app.showNotification");

fs.writeFileSync('js/modules/templates.js', content, 'utf8');
