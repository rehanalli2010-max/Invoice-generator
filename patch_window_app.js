const fs = require('fs');

let file = fs.readFileSync('js/app.js', 'utf8');

const targetStr = `Object.assign(window.app || (window.app = {}), app);`;

if (file.includes(targetStr)) {
    const replacement = `
// Replace the shallow copy with a proxy so that window.app always reflects app's state dynamically,
// or just replace window.app entirely. Let's redirect window.app to app entirely.
window.app = app;
`;

    file = file.replace(targetStr, replacement.trim());
    fs.writeFileSync('js/app.js', file);
    
    console.log("Fixed window.app split brain!");
} else {
    console.error("Target string not found in app.js! Maybe already patched?");
}
