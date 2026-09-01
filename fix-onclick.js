const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Replace standard onclicks
html = html.replace(/onclick="window\.app \&\& app\.([a-zA-Z0-9_]+)\((.*?)\)/g, 'onclick="if(window.app && app.$1) app.$1($2)');
fs.writeFileSync('index.html', html);
