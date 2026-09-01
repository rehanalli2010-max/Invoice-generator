const fs = require('fs');
const cssPath = 'css/style.css';
let css = fs.readFileSync(cssPath, 'utf8');

const regex = /\.sidebar\s*\{[\s\S]*?z-index:\s*100;[\s\S]*?\}/;
const match = css.match(regex);
if (match) {
    const replacement = `.sidebar {
    width: 260px;
    background: var(--glass-bg);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--glass-border);
    border-radius: 1.5rem;
    display: flex;
    flex-direction: column;
    position: fixed;
    height: max-content;
    max-height: calc(100vh - 2rem);
    left: 1rem;
    top: 0;
    bottom: 0;
    margin-top: auto;
    margin-bottom: auto;
    z-index: 100;
    transition: transform 0.3s var(--ease-smooth);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
}`;
    css = css.replace(regex, replacement);
    fs.writeFileSync(cssPath, css);
    console.log("Successfully replaced");
} else {
    console.log("Not found");
}

