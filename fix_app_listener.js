const fs = require('fs');
const content = fs.readFileSync('D:/CODE/Invoice generator/js/app.js', 'utf8');

const regex = /document\.addEventListener\('DOMContentLoaded', async \(\) => {([\s\S]*?)}, \{ once: true \}\);/m;
const match = content.match(regex);
if (match) {
    const inner = match[1];
    const newStr = `const startApp = async () => {${inner}};
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp, { once: true });
} else {
    startApp();
}`;
    fs.writeFileSync('D:/CODE/Invoice generator/js/app.js', content.replace(regex, newStr));
    console.log('Fixed DOMContentLoaded listener');
} else {
    console.log('Listener not found');
}
