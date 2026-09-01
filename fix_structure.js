const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The clients section ends around line 680-700. Wait, let's find it securely.
const clientsIdx = html.indexOf('<section id="clients"');

// Lets find the end of clients section. 
// A section has many <div> inside it. But since we just replaced `</div>` with `</section>` using regex?
// No, the previous script `fix_html_sections.js` only did it for new-invoice. History and Clients were left untouched or wait... `div id="history"` wasn't found because they were already sections from `page-section` replacements?

fs.writeFileSync('debug_html.txt', html);
