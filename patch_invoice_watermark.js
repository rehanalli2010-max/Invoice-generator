const fs = require('fs');
let code = fs.readFileSync('js/invoice.js', 'utf8');

if (!code.includes('invoice-watermark')) {
    code = code.replace(
        '${signatureHTML}\n                </div>',
        '${signatureHTML}\n                    <div class="invoice-watermark" id="invoiceWatermark">\n                        Generated strongly with <span>Invoice Generator</span><br>\n                        Remove this watermark by upgrading to Pro.\n                    </div>\n                </div>'
    );
    fs.writeFileSync('js/invoice.js', code);
    console.log("Invoice watermark added");
} else {
    console.log("Watermark already exists");
}
