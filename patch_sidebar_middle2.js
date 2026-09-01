const fs = require('fs');
const cssPath = 'css/style.css';
let css = fs.readFileSync(cssPath, 'utf8');

css = css.replace(/top: 50%;\s*transform: translateY\(-50%\);/, 
`top: 0;
    bottom: 0;
    margin-top: auto;
    margin-bottom: auto;`);

// Wait, I actually need to make sure I fully replaced what was there previously to be safe.
// So let's re-read and replace.
