// This file runs synchronously before modules load to ensure window.app exists
// preventing click handlers like "onclick="window.app && app.toggleSidebar()" from failing on initial render
window.app = window.app || {};
window.app.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('open');
};
