const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('app.js')) {
    console.error('Missing app.js');
}
