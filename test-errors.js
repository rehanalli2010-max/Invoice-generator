const fs = require('fs');
let html = fs.readFileSync('D:/CODE/Invoice generator/index.html', 'utf8');

const debugScript = `
<script>
window.addEventListener('error', function(e) {
    console.error('GLOBAL ERROR:', e.message, e.filename, e.lineno);
    alert('JS Error: ' + e.message);
});
</script>
`;

if (!html.includes('GLOBAL ERROR')) {
    html = html.replace('<head>', '<head>' + debugScript);
    fs.writeFileSync('D:/CODE/Invoice generator/index.html', html);
    console.log('Added debug script to index.html');
}
