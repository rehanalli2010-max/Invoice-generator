const fs = require('fs');
let css = fs.readFileSync('css/style.css', 'utf8');

let lines = css.split('\n');
let insideMainContent = false;
for (let i = 200; i < lines.length; i++) {
    if (lines[i].includes('.main-content {')) {
        insideMainContent = true;
    } else if (insideMainContent && lines[i].includes('}')) {
        insideMainContent = false;
    } else if (insideMainContent) {
        if (lines[i].includes('max-width: 1440px') || lines[i].includes('margin: 0 auto') || lines[i].includes('width: 100%')) {
            lines[i] = ''; // clear it
        }
    }
}
fs.writeFileSync('css/style.css', lines.filter(l => l !== '').join('\n'));
console.log('Fixed css');
