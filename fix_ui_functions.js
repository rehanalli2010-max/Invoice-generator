const fs = require('fs');

let ui = fs.readFileSync('js/modules/ui.js', 'utf8');
if (!ui.includes('export function showTemplatesView')) {
    ui = ui.replace('export function showDashboardView() {',
`export function showTemplatesView() {
    switchView("templates");
}

export function showPricingView() {
    switchView("pricing");
}

export function showDashboardView() {`);
    fs.writeFileSync('js/modules/ui.js', ui);
    console.log("Updated ui.js with missing show functions");
}
