const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');
content = content.replace('href="css/style.css"', 'href="css/style.css?v=' + Date.now() + '"');
fs.writeFileSync('index.html', content);
