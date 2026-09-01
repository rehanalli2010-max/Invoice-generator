const fs = require('fs');
let css = fs.readFileSync('css/style.css', 'utf8');
css = css.replace(/\.form-row \{\s+display: grid;\s+grid-template-columns: repeat\(auto-fit, minmax\(120px, 1fr\)\);\s+gap: 1\.5rem;\s+margin-bottom: 1\.5rem;\s+\}/m, 
`.form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 1.5rem;
}`);
fs.writeFileSync('css/style.css', css);
console.log('Fixed form-row grid');
