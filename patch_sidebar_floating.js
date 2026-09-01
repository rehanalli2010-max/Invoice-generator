const fs = require('fs');

const cssPath = 'css/style.css';
let css = fs.readFileSync(cssPath, 'utf8');

css = css.replace(/\.sidebar {\s*width: 260px;\s*background: var\(--glass-bg\);\s*backdrop-filter: blur\(16px\);\s*-webkit-backdrop-filter: blur\(16px\);\s*border-right: 1px solid var\(--glass-border\);\s*display: flex;\s*flex-direction: column;\s*position: fixed;\s*height: 100vh;\s*left: 0;\s*top: 0;\s*z-index: 100;\s*transition: transform 0\.3s var\(--ease-smooth\);\s*}/, 
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
    height: calc(100vh - 2rem);
    left: 1rem;
    top: 1rem;
    z-index: 100;
    transition: transform 0.3s var(--ease-smooth);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
}`);

css = css.replace(/\.dashboard-content {\s*margin-left: 260px;/, 
`.dashboard-content {
    margin-left: 292px;`);

css = css.replace(/@media \(max-width: 768px\) {\s*\.dashboard-container {\s*flex-direction: column;\s*}\s*\.sidebar {\s*transform: translateX\(-100%\);\s*}\s*\.sidebar\.open {\s*transform: translateX\(0\);\s*}/,
`@media (max-width: 768px) {
    .dashboard-container {
        flex-direction: column;
    }
    
    .sidebar {
        transform: translateX(calc(-100% - 2rem));
    }
    
    .sidebar.open {
        transform: translateX(0);
    }`);

fs.writeFileSync(cssPath, css);
console.log('Sidebar updated to floating style.');
