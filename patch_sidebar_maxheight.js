const fs = require('fs');
const cssPath = 'css/style.css';
let css = fs.readFileSync(cssPath, 'utf8');

css = css.replace(/height: auto;\s*bottom: auto;/, 'height: auto;\n    max-height: calc(100vh - 2rem);\n    bottom: auto;');

fs.writeFileSync(cssPath, css);
