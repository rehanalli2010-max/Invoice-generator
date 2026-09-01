const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Some return false ones
html = html.replace(/onclick="if\(window\.app \&\& app\.([a-zA-Z0-9_]+)\) app\.\1\((.*?)\); return false;"/g, 'onclick="window.app && window.app.$1 && window.app.$1($2); return false;"');

fs.writeFileSync('index.html', html);
