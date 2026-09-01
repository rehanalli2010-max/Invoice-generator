const { JSDOM } = require("jsdom");
const fs = require('fs');
const html = fs.readFileSync('test_additem.html', 'utf8');

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  resources: "usable",
  url: "file://" + __dirname + "/test_additem.html"
});

setTimeout(() => {
    try {
        console.log("Invoice points:", !!dom.window.app.invoice);
        console.log("Items before:", dom.window.app.invoice.items.length);
        dom.window.document.getElementById('add').click();
        console.log("Items after:", dom.window.app.invoice.items.length);
        console.log("Preview text:", dom.window.document.getElementById('invoicePreview').textContent);
    } catch(e) {
        console.log("Error:", e);
    }
}, 500);
