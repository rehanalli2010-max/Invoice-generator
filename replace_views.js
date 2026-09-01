const fs = require('fs');
const files = fs.readFileSync('list_of_files.txt', 'utf8').split('\n').filter(Boolean);

const replacements = {
    'dashboardView': 'home',
    'invoiceView': 'new-invoice',
    'historyView': 'history',
    'clientsView': 'clients',
    'pricingView': 'pricing',
    'view-section': 'page-section',
    'div id="home"': 'section id="home"',
    'div id="new-invoice"': 'section id="new-invoice"',
    'div id="history"': 'section id="history"',
    'div id="clients"': 'section id="clients"',
    'div id="pricing"': 'section id="pricing"'
};

for (const file of files) {
    let original = fs.readFileSync(file, 'utf8');
    let modified = original;
    for (const [key, value] of Object.entries(replacements)) {
        modified = modified.split(key).join(value);
    }
    // Convert </div> to </section> for these specific sections, which is harder with exact replace. Wait.
    if (original !== modified) {
        fs.writeFileSync(file, modified);
        console.log(`Updated ${file}`);
    }
}
