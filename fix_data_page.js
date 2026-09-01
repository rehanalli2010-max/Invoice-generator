const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Home
    content = content.replace(/(<a[^>]*?class="[^"]*?sidebar-link[^"]*?"[^>]*?)(>[\s]*<span[^>]*>[^<]*?📊[^<]*?<\/span>[\s]*<span[^>]*>Home<\/span>)/g, (match, g1, g2) => {
        if (g1.includes('data-page=')) return match;
        return g1 + ' data-page="home"' + g2;
    });

    // New Invoice
    content = content.replace(/(<a[^>]*?class="[^"]*?sidebar-link[^"]*?"[^>]*?)(>[\s]*<span[^>]*>[^<]*?📝[^<]*?<\/span>[\s]*<span[^>]*>New Invoice<\/span>)/g, (match, g1, g2) => {
        if (g1.includes('data-page=')) return match;
        return g1 + ' data-page="new-invoice"' + g2;
    });

    // History
    content = content.replace(/(<a[^>]*?class="[^"]*?sidebar-link[^"]*?"[^>]*?)(>[\s]*<span[^>]*>[^<]*?📋[^<]*?<\/span>[\s]*<span[^>]*>History<\/span>)/g, (match, g1, g2) => {
        if (g1.includes('data-page=')) return match;
        return g1 + ' data-page="history"' + g2;
    });

    // Clients
    content = content.replace(/(<a[^>]*?class="[^"]*?sidebar-link[^"]*?"[^>]*?)(>[\s]*<span[^>]*>[^<]*?👥[^<]*?<\/span>[\s]*<span[^>]*>Clients<\/span>)/g, (match, g1, g2) => {
        if (g1.includes('data-page=')) return match;
        return g1 + ' data-page="clients"' + g2;
    });

    // Templates
    content = content.replace(/(<a[^>]*?class="[^"]*?sidebar-link[^"]*?"[^>]*?)(>[\s]*<span[^>]*>[^<]*?🏢[^<]*?<\/span>[\s]*<span[^>]*>Templates<\/span>)/g, (match, g1, g2) => {
        if (g1.includes('data-page=')) return match;
        return g1 + ' data-page="templates"' + g2;
    });

    // Pricing
    content = content.replace(/(<a[^>]*?class="[^"]*?sidebar-link[^"]*?"[^>]*?)(>[\s]*<span[^>]*>[^<]*?💎[^<]*?<\/span>[\s]*<span[^>]*>Pricing<\/span>)/g, (match, g1, g2) => {
        if (g1.includes('data-page=')) return match;
        return g1 + ' data-page="pricing"' + g2;
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
