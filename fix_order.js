const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');
const mainRegex = /<main class="main-content" id="mainContent">([\s\S]*?)<\/main>/;

const match = content.match(mainRegex);
if (!match) {
    console.error("No <main> found");
    process.exit(1);
}

let remaining = match[1];

function extractSectionContent(content, id) {
    const startRegex = new RegExp(`<section id="${id}"[^>]*>`);
    const startMatch = content.match(startRegex);
    if (!startMatch) return null;
    
    let startIndex = startMatch.index;
    
    let depth = 0;
    let i = startIndex;
    while(i < content.length) {
        if (content.substr(i, 8) === `<section`) {
            depth++;
            // skip to >
            while(content[i] !== '>' && i < content.length) i++;
            i++;
        } else if (content.substr(i, 10) === `</section>`) {
            depth--;
            i += 10;
            if (depth === 0) {
                return content.substring(startIndex, i);
            }
        } else {
            i++;
        }
    }
    return null;
}

const homeS = extractSectionContent(remaining, 'home');
const newInvoiceS = extractSectionContent(remaining, 'new-invoice');
const historyS = extractSectionContent(remaining, 'history');
const clientsS = extractSectionContent(remaining, 'clients');
const templatesS = extractSectionContent(remaining, 'templates');
const pricingS = extractSectionContent(remaining, 'pricing');

const newMainContent = `
${homeS}
${newInvoiceS}
${historyS}
${clientsS}
${templatesS}
${pricingS}
`;

content = content.replace(mainRegex, `<main class="main-content" id="mainContent">${newMainContent}</main>`);
fs.writeFileSync('index.html', content);
console.log('Reordered sections successfully.');
