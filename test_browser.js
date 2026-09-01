global.localStorage = {
    getItem: function(key) {
        if (key === 'savedPrices') return JSON.stringify({"Test": {price: 99}});
        return null; 
    }
};

const Invoice = require('./js/invoice.js').default || require('./js/invoice.js');
const inv = new Invoice();
inv.addItem("Test", 1, 99, "Qty");
console.log(inv.generateHTML());
