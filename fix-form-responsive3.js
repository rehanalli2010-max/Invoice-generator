const fs = require('fs');
let css = fs.readFileSync('css/style.css', 'utf8');

css = css.replace(/\.content-wrapper \{\s+max-width: 1440px;\s+margin: 0 auto;\s+grid-template-columns: 1fr;\s+\}/m, 
`.content-wrapper {
        grid-template-columns: 1fr;
    }`);

fs.writeFileSync('css/style.css', css);
console.log('Fixed duplicate .content-wrapper mobile style');
