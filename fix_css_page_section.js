const fs = require('fs');

let cssContent = fs.readFileSync('./css/style.css', 'utf8');
// Fix all .page-section instances to properly use display: none
cssContent = cssContent.replace(
    /\.page-section\s*\{\s*display:\s*none;\s*\}/g,
    ".page-section { display: none; }"
);
fs.writeFileSync('./css/style.css', cssContent);
console.log("Fixed page-section css");
