const fs = require('fs');

let html = fs.readFileSync('clients.html', 'utf8');
let styleCss = fs.readFileSync('css/style.css', 'utf8');

// The class .history-grid is already duplicated in style.css.
// In clients.html, we modify the inline CSS block for it to make sure it looks correct on mobile.

html = html.replace(/\.history-grid \{[\s\S]*?\}\n        \.history-card/g, `.history-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
            margin-bottom: 2.5rem;
        }
        @media (max-width: 768px) {
            .history-grid {
                grid-template-columns: 1fr;
            }
        }
        .history-card`);

fs.writeFileSync('clients.html', html);
console.log("Done");
