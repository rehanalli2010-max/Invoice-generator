const fs = require('fs');
let html = fs.readFileSync('dashboard.html', 'utf8');

// Fix dashboard.html as well
html = html.replace(/onclick="if\(window\.app \&\& app\.([a-zA-Z0-9_]+)\) app\.\1\((.*?)\)"/g, 'onclick="window.app && window.app.$1 && window.app.$1($2)"');
html = html.replace(/onclick="window\.app \&\& app\.([a-zA-Z0-9_]+)\((.*?)\)"/g, 'onclick="window.app && window.app.$1 && window.app.$1($2)"');

fs.writeFileSync('dashboard.html', html);
