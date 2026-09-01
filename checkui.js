
import { showInvoiceHistory, closeModal, renderHistoryList, renderHistoryItem, updateAnalyticsDashboard, searchHistory, filterHistory, loadInvoiceById, deleteInvoiceFromHistory, clearAllData, togglePaymentStatus, generateNextInvoice, renderCharts, toggleAllInvoices, updateInvoiceStatus, showEmailConfigModal, duplicateInvoice, sendInvoiceToClient, convertToInvoice, generatePayLink, filterByDateRange, getDateFilteredInvoices, renderMonthlyHeatmap } from "./modules/history.js";
import { saveClient, loadClient, showClientManager, closeClientModal, renderClientDropdown, renderClientList, searchClients, loadClientById, deleteClientById, addClient } from "./modules/clients.js";
import { showProductCatalog, closeProductCatalog, renderProductCatalog, renderSavedProductsDropdown, addProductToInvoice, saveCurrentItemToCatalog, deleteProductById, addProductFromSaved } from "./modules/products.js";
import { showConfirm, showNotification, showAutoSaveIndicator, setupAutoSave, setupModalKeyboardHandling, setupEventListeners, setupScrollListener, initCustomSelects, syncCustomSelects, selectThemeSwatch, applyTheme, setThemeMode, loadThemePreference, showDashboardView, showInvoiceView, hideAllViews, setActiveNav, updateHeader, switchView } from "./modules/ui.js";

const originalShowInvoiceHistory = showInvoiceHistory;
const wrappedShowInvoiceHistory = function() {
    originalShowInvoiceHistory.apply(this, arguments);
    if (window.app && typeof window.app.closeSidebar === "function") {
        window.app.closeSidebar();
    }
}
const originalShowClientManager = showClientManager;
const wrappedShowClientManager = function() {
    originalShowClientManager.apply(this, arguments);
    if (window.app && typeof window.app.closeSidebar === "function") {
        window.app.closeSidebar();
    }
}

const originalShowDashboardView = showDashboardView;
const wrappedShowDashboardView = function() {
    originalShowDashboardView.apply(this, arguments);
    if (window.app && typeof window.app.closeSidebar === "function") {
        window.app.closeSidebar();
    }
}


