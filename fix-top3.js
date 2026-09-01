const fs = require('fs');
let appJs = fs.readFileSync('js/app.js', 'utf8');
const regex = /(import .*?\n)+/g;
let imports = [];
let match;
while ((match = regex.exec(appJs)) !== null) {
    imports.push(match[0]);
}

// Remove all imports from everywhere
appJs = appJs.replace(/(import .*?\n)+/g, '');

// Prepend imports
appJs = imports.join('') + '\n' + appJs;

fs.writeFileSync('js/app.js', appJs);
