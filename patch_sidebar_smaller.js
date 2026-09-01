const fs = require('fs');

const cssPath = 'css/style.css';
let css = fs.readFileSync(cssPath, 'utf8');

css = css.replace(/\.sidebar {\s*width: 260px;\s*background: var\(--glass-bg\);\s*backdrop-filter: blur\(16px\);\s*-webkit-backdrop-filter: blur\(16px\);\s*border: 1px solid var\(--glass-border\);\s*border-radius: 1\.5rem;\s*display: flex;\s*flex-direction: column;\s*position: fixed;\s*height: calc\(100vh - 2rem\);\s*left: 1rem;\s*top: 1rem;\s*z-index: 100;\s*transition: transform 0\.3s var\(--ease-smooth\);\s*box-shadow: var\(--shadow-lg\);\s*overflow: hidden;\s*}/, 
`.sidebar {
    width: 260px;
    background: var(--glass-bg);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--glass-border);
    border-radius: 1.5rem;
    display: flex;
    flex-direction: column;
    position: fixed;
    height: auto;
    bottom: auto;
    left: 1rem;
    top: 1rem;
    z-index: 100;
    transition: transform 0.3s var(--ease-smooth);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
}`);

fs.writeFileSync(cssPath, css);
console.log('Sidebar updated to be even smaller (hugs content).');
