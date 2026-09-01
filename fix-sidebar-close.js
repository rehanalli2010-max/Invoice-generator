const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(
    '                <button class="btn btn-icon sidebar-close-btn" onclick="window.app && window.app.closeSidebar && window.app.closeSidebar()">×</button>\n',
    ''
);

fs.writeFileSync('index.html', html);
console.log('Done');
