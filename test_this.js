// module scope test
const app = {};

function addItem() {
    console.log(this === app);
    console.log(this.invoice);
}
app.invoice = { addItem: () => 'added' };
app.addItem = addItem;

app.addItem();
