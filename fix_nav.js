const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Change navHome href
html = html.replace(
    /<a href="index\.html" class="sidebar-link" id="navHome"/g, 
    '<a href="#" onclick="window.app && window.app.showDashboardView && window.app.showDashboardView(); return false;" class="sidebar-link" id="navHome"'
);

// We need a showTemplates and showPricing function, or we can just call switchView directly if window.app exposes it?
// Let's add the switchView wrappers in ui.js instead, and use them here.
html = html.replace(
    /<a href="templates\.html" class="sidebar-link" id="navTemplates"/g,
    '<a href="#" onclick="window.app && window.app.showTemplatesView && window.app.showTemplatesView(); return false;" class="sidebar-link" id="navTemplates"'
);

html = html.replace(
    /<a href="pricing\.html" class="sidebar-link" id="navPricing"/g,
    '<a href="#" onclick="window.app && window.app.showPricingView && window.app.showPricingView(); return false;" class="sidebar-link" id="navPricing"'
);

fs.writeFileSync('index.html', html);
console.log('Navigation updated in index.html');
