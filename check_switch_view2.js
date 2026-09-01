export function switchView(viewId) {
    hideAllViews();
    const view = document.getElementById(viewId);
    if (view) {
        view.style.display = 'block';
        // Allow the browser to register display: block before adding the active class
        // This makes CSS opacity/transform transitions work smoothly
        setTimeout(() => {
            view.classList.add('active');
        }, 10);
    }
    
    // Update active nav based on viewId
    let navId = '';
    let title = 'Invoice Generator';
    let subtitle = 'Professional invoice creation made easy';
    
    if (viewId === 'home') {
        navId = 'navDashboard';
    } else if (viewId === 'new-invoice') {
        navId = 'navInvoice';
        title = 'New Invoice';
        subtitle = 'Create a new professional invoice';
    } else if (viewId === 'history') {
        navId = 'navHistory';
        title = 'Invoice History';
        subtitle = 'View and manage past invoices';
    } else if (viewId === 'clients') {
        navId = 'navClients';
        title = 'Clients';
        subtitle = 'Manage your clients';
    } else if (viewId === 'pricing') {
        title = 'Pricing';
        subtitle = 'Simple, transparent pricing for every stage.';
    }
    
    if (navId) {
        setActiveNav(navId);
    } else {
        document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
    }
    updateHeader(title, subtitle);
}
