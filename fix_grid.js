const fs = require('fs');

let css = fs.readFileSync('css/style.css', 'utf8');

css = css.replace(/\.history-grid \{\n    display: grid;\n    grid-template-columns: repeat\(5, 1fr\);\n\}\n@media \(max-width: 1024px\) \{\n    \.history-grid \{\n        grid-template-columns: repeat\(3, 1fr\);\n    \}\n\}\n@media \(max-width: 768px\) \{\n    \.history-grid \{\n        grid-template-columns: repeat\(2, 1fr\);\n    \}\n\}\n@media \(max-width: 480px\) \{\n    \.history-grid \{\n        grid-template-columns: 1fr;\n    \}\n    gap: 1rem;\n    margin-bottom: 1rem;\n\}/g, `.history-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 1rem;
    margin-bottom: 1rem;
}
@media (max-width: 1024px) {
    .history-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}
@media (max-width: 768px) {
    .history-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}
@media (max-width: 480px) {
    .history-grid {
        grid-template-columns: 1fr;
    }
}`);
fs.writeFileSync('css/style.css', css);
console.log("Done");
