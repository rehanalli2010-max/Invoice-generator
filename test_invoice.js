const Invoice = require('./js/invoice.js').default || require('./js/invoice.js');
try {
    global.localStorage = {
        getItem: (key) => {
            if (key === 'savedPrices') return JSON.stringify({ "Test item": { price: 99.00 } });
            return null;
        }
    };
    const inv = new Invoice();
    inv.addItem("Test item", 1, 100, "Qty");
    const html = inv.generateHTML();
    console.log(html);
} catch(e) {
    console.error("Error:", e);
}
