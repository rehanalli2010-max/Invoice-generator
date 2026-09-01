
app.toggleSidebar = function() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
        sidebar.classList.toggle("open");
    }
};

app.handleNewInvoice = function () {
    showInvoiceView();
    // Reset form for a new invoice
    this._suppressPreview = true;
    try {
        document.getElementById("clientName").value = "";
        document.getElementById("clientEmail").value = "";
        document.getElementById("clientPhone").value = "";
        document.getElementById("clientAddress").value = "";
        document.getElementById("invoiceNumber").value = this.storage.peekNextInvoiceNumber();
        document.getElementById("invoiceDate").value = "";
        document.getElementById("dueDate").value = "";
        document.getElementById("notes").value = "";
        document.getElementById("taxRate").value = "0";
        document.getElementById("discountRate").value = "0";
        document.getElementById("currency").value = "USD";
        if (this.currentInvoiceId) {
            delete this.currentInvoiceId;
        }

        const itemsList = document.getElementById("itemsList");
        if (itemsList) {
            itemsList.innerHTML = "";
            this.addItem();
        }

        this.updatePreview();
        
        // Ensure sidebar is closed on mobile after navigation
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById("sidebar");
            if (sidebar && sidebar.classList.contains("open")) {
                sidebar.classList.remove("open");
            }
        }
        
    } finally {
        this._suppressPreview = false;
        this.updatePreview();
        this.updatePaymentLink();
    }
};

