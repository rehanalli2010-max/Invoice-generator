const fs = require('fs');

let ui = fs.readFileSync('js/modules/ui.js', 'utf8');

if (!ui.includes('else if (viewId === "templates")')) {
    ui = ui.replace('else if (viewId === "pricing") {',
`else if (viewId === "templates") {
        navId = "navTemplates";
        title = "Templates";
        subtitle = "Customize your invoice appearance";
    } else if (viewId === "pricing") {`);
    fs.writeFileSync('js/modules/ui.js', ui);
    console.log("Updated switchView nav logic for templates");
}
