const fs = require('fs');
const content = fs.readFileSync('D:/CODE/Invoice generator/js/modules/invoice-ui.js', 'utf8');

const newCode = `        const json = this.invoice.toJSON();
        
        if (this.token) {
            try {
                const result = await this.apiSaveInvoice(json);
                if (!result) {
                    this.showNotification(isDraft ? 'Failed to save draft' : 'Failed to save invoice', 'error');
                    return;
                }
            } catch (err) {
                this.showNotification(isDraft ? 'Failed to save draft' : 'Failed to save invoice', 'error');
                return;
            }
        } else {
            const alreadyExists = this.storage.getInvoices().some(inv => inv.invoiceNumber === this.invoice.invoiceNumber && String(inv.id) !== String(this.invoice.id));
            if (alreadyExists) {
                this.showNotification(\`Invoice number \${this.invoice.invoiceNumber} already used by another invoice.\`, 'error');
                return;
            }
            const success = this.storage.saveInvoice(json);
            if (!success) {
                this.showNotification(isDraft ? 'Failed to save draft' : 'Failed to save invoice', 'error');
                return;
            }
        }`;

// Let's use regex to replace between `const json = this.invoice.toJSON();` and `this.showNotification(successMessage, 'success');`
const regex = /const json = this\.invoice\.toJSON\(\);[\s\S]*?this\.showNotification\(successMessage, 'success'\);/m;
if (!content.match(regex)) {
    console.log("NOT FOUND!");
} else {
    fs.writeFileSync('D:/CODE/Invoice generator/js/modules/invoice-ui.js', content.replace(regex, newCode + "\n        this.showNotification(successMessage, 'success');"));
    console.log("FIXED!");
}
