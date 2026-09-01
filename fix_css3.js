const fs = require('fs');
let css = fs.readFileSync('css/style.css', 'utf8');

css = css.replace(/\.content-wrapper \{\s*max-width: 1440px;\s*margin: 0 auto;\s*display: block !important;\s*max-width: 100% !important;\s*\}/, `.content-wrapper { \n        display: block !important; \n        max-width: 100% !important; \n    }`);

fs.writeFileSync('css/style.css', css);
