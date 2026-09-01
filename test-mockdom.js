const fs = require('fs');

const Invoice = require('./js/invoice.js').default || require('./js/invoice.js');

const app = {
    invoice: new Invoice(),
    updatePreview: function() { console.log("updatePreview called"); },
    updateItemAmount: function(row) { 
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const unitPrice = parseFloat(row.querySelector('.item-unit-price').value) || 0;
        row.querySelector('.item-amount').textContent = "$" + (quantity * unitPrice).toFixed(2);
    }
};
app.invoice.getCurrencySymbol = function() { return "$"; };

// Using exact logic from updateItemFromRow in invoice-ui.js
app.updateItemFromRow = function(target) {
    const row = target.closest('.item-row');
    if (!row) return;
    const itemId = row.getAttribute('data-item-id') || row.dataset.itemId;
    const description = row.querySelector('.item-description').value;

    // Check if the user is typing the description and we have a saved price
    if (target.classList.contains('item-description')) {
        try {
            if (typeof localStorage !== 'undefined') {
                const savedPrices = JSON.parse(localStorage.getItem('savedPrices') || '{}');
                const savedData = savedPrices[description.trim()];
                if (savedData && typeof savedData.price === 'number') {
                    // Update the price input field with the saved price!
                    const priceInput = row.querySelector('.item-unit-price');
                    if (priceInput && (parseFloat(priceInput.value) === 0 || priceInput.value === '')) {
                        priceInput.value = savedData.price;
                    }
                }
            }
        } catch (e) {
            // Ignore
        }
    }

    const quantityVal = row.querySelector('.item-quantity').value; const quantity = parseFloat(String(quantityVal).replace(',', '.')) || 0;
    const unitPriceVal = row.querySelector('.item-unit-price').value; const unitPrice = parseFloat(String(unitPriceVal).replace(',', '.')) || 0;
    const unit = row.querySelector('.item-unit').value || 'Qty';

    if (quantity < 0 || unitPrice < 0) {
        console.log("Quantity and price cannot be negative");
        return;
    }

    this.invoice.updateItem(itemId, { description, quantity, unitPrice, unit });
    this.updateItemAmount(row);
    this.updatePreview();
}

global.localStorage = {
    getItem: (key) => {
        if (key === 'savedPrices') return JSON.stringify({ "apple": { price: 2.50 }});
        return null; // Don't crash for other keys
    }
};

const dom = require('jsdom');
const { JSDOM } = dom;
const mydom = new JSDOM(`
    <table><tbody id="itemsTableBody">
        <div class="item-row row-enter" data-item-id="item-1">
            <div class="item-row-top">
                <input type="text" class="item-description" value="apple">
                <input type="text" class="item-unit" value="Qty">
                <input type="number" class="item-quantity" value="1">
            </div>
            <div class="item-row-bottom">
                <input type="number" class="item-unit-price" value="0">
                <span class="item-amount">$0.00</span>
            </div>
        </div>
    </tbody></table>
`);
global.document = mydom.window.document;


app.invoice.items = [{id: "item-1", quantity: 1, unitPrice: 0}];

const target = document.querySelector('.item-description');
app.updateItemFromRow(target);

console.log("Invoice item unitPrice in data:", app.invoice.items[0].unitPrice);
console.log("Invoice DOM amount due:", document.querySelector('.item-amount').textContent);

