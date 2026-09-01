const fs = require('fs');
let content = fs.readFileSync('js/modules/ui.js', 'utf8');

const lines = content.split('\n');
const validLines = [];
let i = 0;
while(i < lines.length) {
    if (lines[i].includes('export function switchView(viewId) {')) {
        break;
    }
    validLines.push(lines[i]);
    i++;
}

validLines.push(`export function switchView(viewId) {
    hideAllViews();
    const view = document.getElementById(viewId);
    if (view) {
        view.style.display = "block";
        setTimeout(() => view.classList.add("active"), 10);
    }
    
    // Update active nav based on viewId
    let navId = "";
    let title = "Invoice Generator";
    let subtitle = "Professional invoice creation made easy";
    
    if (viewId === "home") {
        navId = "navHome";
    } else if (viewId === "new-invoice") {
        navId = "navInvoice";
        title = "New Invoice";
        subtitle = "Create a new professional invoice";
    } else if (viewId === "history") {
        navId = "navHistory";
        title = "Invoice History";
        subtitle = "View and manage past invoices";
    } else if (viewId === "clients") {
        navId = "navClients";
        title = "Clients";
        subtitle = "Manage your clients";
    } else if (viewId === "pricing") {
        navId = "navPricing";
        title = "Pricing";
        subtitle = "Simple, transparent pricing for every stage.";
    }
    
    if (navId) {
        setActiveNav(navId);
    } else {
        document.querySelectorAll(".sidebar-link").forEach(link => link.classList.remove("active"));
    }
    updateHeader(title, subtitle);
}`);

fs.writeFileSync('js/modules/ui.js', validLines.join('\n'));
