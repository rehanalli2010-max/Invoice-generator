const fs = require('fs');
let code = fs.readFileSync('js/app.js', 'utf8');

// The issue might just be that I replaced window.app at the top, fixing this.
// Let's ask the user again.
