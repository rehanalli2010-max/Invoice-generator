const fs = require('fs');
let appJs = fs.readFileSync('js/app.js', 'utf8');
const lines = appJs.split('\n');
let i = 0;
while(!lines[i].startsWith('import ')) i++;

const newLines = lines.slice(i);
let finalCode = newLines.join('\n');
if (finalCode.includes('import { API_BASE }')) {
    console.log("Found imports");
}
fs.writeFileSync('js/app.js', finalCode);
