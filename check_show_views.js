
export function showDashboardView() {
    clearAutoSave.call(this);
    switchView("home");
    // Render dashboard charts when showing the dashboard view
    if (typeof this.renderDashboard === "function") {
        this.renderDashboard();
    }
}

export function showInvoiceView() {
    switchView("new-invoice");
}

