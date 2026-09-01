const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const mainStartRegex = /<main class="main-content" id="mainContent">([\s\S]*?)<\/main>/;
const match = html.match(mainStartRegex);

if (!match) {
    console.log("Could not find main tag.");
    process.exit(1);
}

let mainContent = match[1];

// Function to extract a section by id
function extractSectionContent(content, id) {
    // This looks for `<tag id="ID" class="...">` and matches until matching closing tag
    // Since naive regex is hard for nested tags, we'll try to find the start and find the closing by counting tags.
    const startRegex = new RegExp(`<([^\s>]+)[^>]*id="${id}"[^>]*>`);
    const startMatch = content.match(startRegex);
    if (!startMatch) return null;
    
    const tag = startMatch[1];
    let startIndex = startMatch.index;
    
    let depth = 0;
    let i = startIndex;
    while(i < content.length) {
        if (content.substr(i, tag.length + 1) === `<${tag}`) {
            depth++;
            // skip to >
            while(content[i] !== '>' && i < content.length) i++;
            i++;
        } else if (content.substr(i, tag.length + 3) === `</${tag}>`) {
            depth--;
            i += tag.length + 3;
            if (depth === 0) {
                return content.substring(startIndex + startMatch[0].length, i - (tag.length + 3));
            }
        } else {
            i++;
        }
    }
    return null;
}

const homeContent = extractSectionContent(mainContent, 'home') || '\n        <!-- Home content -->\n    ';
const newInvoiceContent = extractSectionContent(mainContent, 'new-invoice') || '\n        <!-- New Invoice content -->\n    ';
const historyContent = extractSectionContent(mainContent, 'history') || '\n        <!-- History content -->\n        <h1>History</h1>\n    ';
const clientsContent = extractSectionContent(mainContent, 'clients') || '\n        <!-- Clients content -->\n        <h1>Manage Clients</h1>\n    ';
const templatesContent = '\n        <!-- Templates content -->\n    ';
const pricingContent = '\n        <!-- Pricing content -->\n    ';


const newMain = `<main class="main-content" id="mainContent">

    <section id="home" class="page-section active">
${homeContent}
    </section>

    <section id="new-invoice" class="page-section">
${newInvoiceContent}
    </section>

    <section id="history" class="page-section">
${historyContent}
    </section>

    <section id="clients" class="page-section">
${clientsContent}
    </section>

    <section id="templates" class="page-section">
${templatesContent}
    </section>

    <section id="pricing" class="page-section">
${pricingContent}
    </section>

</main>`;

html = html.replace(mainStartRegex, newMain);
fs.writeFileSync('index.html', html);
console.log("Successfully rebuilt main-content");
