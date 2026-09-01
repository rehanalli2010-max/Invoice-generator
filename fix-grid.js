const fs = require('fs');
let css = fs.readFileSync('css/style.css', 'utf8');
css = css.replace(/\.content-wrapper \{\s+max-width: 1440px;\s+margin: 0 auto;\s+display: grid;\s+grid-template-columns: 5\.5fr 4\.5fr;\s+gap: 2rem;\s+align-items: start;\s+\}/m, 
`.content-wrapper {
    max-width: 1440px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    align-items: start;
}`);
fs.writeFileSync('css/style.css', css);
console.log('Fixed content-wrapper grid');
