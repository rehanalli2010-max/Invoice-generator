const fs = require('fs');

const file = 'js/modules/history.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /<button class="btn btn-success btn-sm" data-action="mark-paid" data-invoice-id="\$\{escapeHtml\(inv\.id\)\}" title="Mark as Paid">[\s\S]*?<\/button>/;

// Also added style="pointer-events: none;" to the SVG to ensure the click falls on the button itself.
const replacement = `<button class="btn btn-success btn-sm" data-action="mark-paid" data-invoice-id="\${escapeHtml(inv.id)}" title="Mark as Paid">
                        <svg style="pointer-events: none;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </button>`;

content = content.replace(regex, replacement);

fs.writeFileSync(file, content);
console.log('Patched history.js with pointer-events');
