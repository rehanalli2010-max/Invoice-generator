const fs = require('fs');
let lines = fs.readFileSync('index.html', 'utf8').split('\n');

// We want to replace line 758 and 786 with </section>
// Let's find them reliably by content.
for (let i=0; i<lines.length; i++) {
    if (lines[i].includes('<!-- Clients View -->')) {
        let j = i - 1;
        while(j > 0 && !lines[j].includes('</div>')) j--;
        if (lines[j].includes('</div>')) {
            lines[j] = lines[j].replace('</div>', '</section>'); // closes history
        }
        
        let k = i + 1;
        // find end of clients View
        while(k < lines.length && !lines[k].includes('<!-- Footer Banner Ad')) k++;
        let endClients = k - 1;
        while(endClients > i && !lines[endClients].includes('</div>')) endClients--;
        if (lines[endClients].includes('</div>')) {
            lines[endClients] = lines[endClients].replace('</div>', '</section>'); // closes clients
            
            // Insert templates and pricing right after this line
            const additionalSections = `
    <section id="templates" class="page-section">
        <!-- Templates content -->
    </section>

    <section id="pricing" class="page-section">
        <!-- Pricing content -->
    </section>
</main>
`;
            lines.splice(endClients + 1, 0, additionalSections);
            break;
        }
    }
}

fs.writeFileSync('index.html', lines.join('\n'));
console.log("Successfully rebuilt index.html main structure");
