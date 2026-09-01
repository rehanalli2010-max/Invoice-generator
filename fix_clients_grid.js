const fs = require('fs');

let html = fs.readFileSync('clients.html', 'utf8');

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
