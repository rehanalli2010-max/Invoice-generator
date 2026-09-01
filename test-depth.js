const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split('\n');

let depth = 0;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const open = (line.match(/<div[\s>]/gi) || []).length;
    const close = (line.match(/<\/div>/gi) || []).length;
    depth += open - close;
    if (depth < 0) {
        console.log(`Negative depth at line ${i + 1}:`);
        console.log(lines.slice(Math.max(0, i - 10), i + 2).join('\n'));
        break;
    }
}
