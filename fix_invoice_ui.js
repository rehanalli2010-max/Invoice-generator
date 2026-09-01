const fs = require('fs');
let content = fs.readFileSync('D:/CODE/Invoice generator/js/modules/invoice-ui.js', 'utf8');

const replacement = `    }
}

export async function saveDraft`;

content = content.replace(/    \}\n\nexport async function saveDraft/m, replacement);
fs.writeFileSync('D:/CODE/Invoice generator/js/modules/invoice-ui.js', content);
console.log('Fixed missing brace');
