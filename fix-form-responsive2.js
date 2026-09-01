const fs = require('fs');
let css = fs.readFileSync('css/style.css', 'utf8');
if (!css.includes('.content-wrapper {\n        grid-template-columns: 1fr;\n    }')) {
  console.log("Not replaced");
} else {
  console.log("Replaced correctly");
}
