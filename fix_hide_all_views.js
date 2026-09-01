const fs = require('fs');

let indexContent = fs.readFileSync('index.html', 'utf8');
const oldHome = `<section id="home" class="page-section active">`;
const newHome = `<section id="home" class="page-section active" style="display: block;">`;

if (!indexContent.includes(newHome)) {
    indexContent = indexContent.replace(oldHome, newHome);
    fs.writeFileSync('index.html', indexContent);
    console.log("Updated index.html home section to show by default");
} else {
    console.log("index.html home section already updated");
}

let uiContent = fs.readFileSync('js/modules/ui.js', 'utf8');
uiContent = uiContent.replace(
    /        if \(el\) {\n            el.classList.remove\('active'\);\n            el.style.display = 'none';\n        }/g,
    "        if (el) {\n            el.classList.remove('active');\n            el.style.display = 'none';\n            el.removeAttribute('style'); // fallback to CSS display: none\n        }"
);
fs.writeFileSync('js/modules/ui.js', uiContent);
console.log("Updated js/modules/ui.js hideAllViews");
