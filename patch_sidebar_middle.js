const fs = require('fs');
const cssPath = 'css/style.css';
let css = fs.readFileSync(cssPath, 'utf8');

css = css.replace(/height: auto;\s*max-height: calc\(100vh - 2rem\);\s*bottom: auto;\s*left: 1rem;\s*top: 1rem;/, 
`height: auto;
    max-height: calc(100vh - 2rem);
    bottom: auto;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);`);

fs.writeFileSync(cssPath, css);
