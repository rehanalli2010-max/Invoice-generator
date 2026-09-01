const fs = require('fs');

const uiContent = fs.readFileSync('./js/modules/ui.js', 'utf8');
const expected = "el.style.display = 'none';";
if (!uiContent.includes(expected)) {
    console.error("Missing style.display = 'none' in hideAllViews");
    process.exit(1);
} else {
    console.log("hideAllViews looks correct now");
}

let switchViewFunc = uiContent.match(/export function switchView\(viewId\) \{[\s\S]*?\n\}/);
if (switchViewFunc) {
      console.log("Found switchView:");
      console.log(switchViewFunc[0]);
}
