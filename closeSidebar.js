
// Ensure sidebar is closed on mobile after navigation
app.closeSidebar = function() {
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById("sidebar");
        if (sidebar && sidebar.classList.contains("open")) {
            sidebar.classList.remove("open");
        }
    }
}

