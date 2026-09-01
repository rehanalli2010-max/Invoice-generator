
export function switchView(viewId) {
    const mainContent = document.querySelector(".dashboard-content");
    if (mainContent) {
        mainContent.classList.remove("slide-bck-center");
        // Force reflow
        void mainContent.offsetWidth;
        mainContent.classList.add("slide-bck-center");
        
        // Remove animation after it completes
        setTimeout(() => {
            mainContent.classList.remove("slide-bck-center");
        }, 450);
    }
    
    hideAllViews();
    const view = document.getElementById(viewId);
    if (view) {
        view.style.display = "block";
        view.classList.add("active");
    }
    
    // Update active nav based on viewId
    let navId = "";
    let title = "Invoice Generator";
    let subtitle = "Professional invoice creation made easy";
    
    if (viewId === "home") {
        navId = "navDashboard";
    } else if (viewId === "new-invoice") {
        navId = "navInvoice";
        title = "New Invoice";
        subtitle = "Create a new professional invoice";
    } else if (viewId === "history") {
        navId = "navHistory";
        title = "Invoice History";
        subtitle = "View and manage past invoices";
    } else if (viewId === "clients") {
        navId = "navClients";
        title = "Clients";
        subtitle = "Manage your clients";
    } else if (viewId === "pricing") {
        title = "Pricing";
        subtitle = "Simple, transparent pricing for every stage.";
    }
    
    if (navId) {
        setActiveNav(navId);
    } else {
        document.querySelectorAll(".sidebar-link").forEach(link => link.classList.remove("active"));
    }
    updateHeader(title, subtitle);
}

