const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const regex = /<\w+[>\s]|<\/\w+>/gi;
let match;
let depth = 0;
while ((match = regex.exec(html)) !== null) {
    const tag = match[0].split(/[>\s]/)[0].toLowerCase().replace('<', '');
    if (match[0].startsWith('</')) {
        depth--;
        if (depth < 0) {
            console.log(`Negative depth at index ${match.index} for tag ${tag}`);
            console.log(html.substring(Math.max(0, match.index - 50), match.index + 50));
            break;
        }
    } else if (!tag.startsWith('/') && !['img', 'br', 'hr', 'input', 'meta', 'link', 'source'].includes(tag)) {
        depth++;
    }
}
