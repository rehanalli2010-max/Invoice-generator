const fs = require('fs');
let css = fs.readFileSync('css/style.css', 'utf8');

css = css.replace(/\s*\.main-content \{\s*padding: 0 !important;\s*\}/, `    .main-content { \n        padding: 0 !important; \n        max-width: 100% !important;\n    }`);
css = css.replace(/\s*\.content-wrapper \{\s*max-width: 1440px;\s*margin: 0 auto;\s*display: block !important;\s*\}/, `    .content-wrapper { \n        display: block !important; \n        max-width: 100% !important; \n    }`);

fs.writeFileSync('css/style.css', css);
