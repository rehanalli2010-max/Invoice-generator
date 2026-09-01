const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const tags = ['div', 'section', 'main', 'header', 'aside', 'nav'];
for (const tag of tags) {
    const open = (html.match(new RegExp(`<${tag}[>\s]`, 'gi')) || []).length;
    const close = (html.match(new RegExp(`</${tag}>`, 'gi')) || []).length;
    console.log(tag, open, close);
}
