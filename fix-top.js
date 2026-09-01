const fs = require('fs');
let appJs = fs.readFileSync('js/app.js', 'utf8');
appJs = appJs.replace('window.app = window.app || {};\n', '');
fs.writeFileSync('js/app.js', appJs);
