const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The replacement was flawed, let's fix the logic
html = html.replace(/onclick="if\(window\.app \&\& app\.([a-zA-Z0-9_]+)\) app\.\1\((.*?)\)"/g, 'onclick="window.app && window.app.$1 && window.app.$1($2)"');

fs.writeFileSync('index.html', html);
