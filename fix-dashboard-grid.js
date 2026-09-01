const fs = require('fs');
let css = fs.readFileSync('css/style.css', 'utf8');

if (css.includes('grid-template-columns: repeat(2, 1fr)')) {
  console.log('Dashboard grid is already 2 columns');
} else {
  console.log('Need to fix dashboard grid');
}
