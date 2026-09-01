const fs = require('fs');
const file = 'js/app.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
        /export default class App \{\n    savePrice\(target, itemId\) \{[\s\S]*?\n    \}\n/m,
        'export default class App {\n'
);
fs.writeFileSync(file, content);
console.log('cleaned');
