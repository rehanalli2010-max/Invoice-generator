const fs = require('fs');
const files = ['clients.html', 'dashboard.html', 'history.html', 'index.html', 'out.html', 'pricing.html'];

for (const file of files) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    // We want to replace <h2>Invoice Generator</h2> with <h2 style="cursor: pointer;" onclick="window.location.href='index.html';">Invoice Generator</h2>
    // inside the sidebar-header div
    
    // Using a more robust regex that ensures we're only changing the sidebar header
    const newContent = content.replace(
      /(<div class="sidebar-header">\s*)<h2>(Invoice Generator)<\/h2>/g, 
      '$1<h2 style="cursor: pointer;" onclick="window.location.href=\'index.html\';" title="Go to Home">$2</h2>'
    );
    
    if (content !== newContent) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`Updated ${file}`);
    } else {
      console.log(`No changes made to ${file}`);
    }
  } catch (err) {
    console.error(`Error processing ${file}:`, err);
  }
}
