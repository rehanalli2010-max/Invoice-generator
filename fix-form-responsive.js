const fs = require('fs');
let css = fs.readFileSync('css/style.css', 'utf8');
css = css.replace(/@media \(max-width: 768px\) {\s+\.main-content \{\s+padding: 1rem;\s+\}\s+\.form-section \{\s+padding: 1\.25rem;\s+\}\s+\.form-section h2 \{\s+font-size: 1\.35rem;\s+\}\s+\.form-row \{\s+grid-template-columns: 1fr;\s+gap: 1rem;\s+\}/m, 
`@media (max-width: 768px) {
    .content-wrapper {
        grid-template-columns: 1fr;
    }
    .main-content {
        padding: 1rem;
    }
    .form-section {
        padding: 1.25rem;
    }
    .form-section h2 {
        font-size: 1.35rem;
    }
    .form-row {
        grid-template-columns: 1fr;
        gap: 1rem;
    }`);
fs.writeFileSync('css/style.css', css);
console.log('Fixed form responsive');
