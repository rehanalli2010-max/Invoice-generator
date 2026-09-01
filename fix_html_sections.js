const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Replace closing divs with closing sections
html = html.replace('</div><!-- end new-invoice -->', '</section><!-- end new-invoice -->');

html = html.replace(/<div id="history" class="page-section">/g, '<section id="history" class="page-section">');
html = html.replace(/<div id="clients" class="page-section">/g, '<section id="clients" class="page-section">');

// Need a smart way to change closing tags of the replaced divs, but this might be error-prone doing it purely with text match.
// Let's use a naive script or just replace </div> for history and clients knowing where they end.
// We can do it manually or semi-manually since there are only 4 views currently in index.html.

fs.writeFileSync('index.html', html);
