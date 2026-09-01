const fs = require('fs');
let appJs = fs.readFileSync('js/app.js', 'utf8');

// The assignment is currently at the very top: window.app = window.app || {};
// We want to export properly and merge. Let's make sure window.app is defined.
appJs = appJs.replace('window.app = Object.assign(window.app || {}, app);', 'window.app = app; Object.assign(window.app, app);');

fs.writeFileSync('js/app.js', appJs);
