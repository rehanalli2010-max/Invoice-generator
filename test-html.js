import('./js/invoice.js').then(module => {
    global.localStorage = {
        getItem: () => 'UTC'
    };
    global.navigator = { language: 'en-US' };
    const Invoice = module.default;
    const inv = new Invoice();
    inv.addItem('Test', 1, 10.5, 'Qty');
    console.log("Subtotal:", inv.getSubtotal());
    console.log("Tax:", inv.getTaxAmount());
    console.log("Discount:", inv.getDiscountAmount());
    console.log("Total:", inv.getTotal());
});
