
export function hideAllViews() {
    const views = ["home", "new-invoice", "history", "clients", "pricing"];
    views.forEach(v => {
        const el = document.getElementById(v);
        if (el) {
            el.classList.remove("active");
        }
    });
    // Add close sidebar here for all views
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById("sidebar");
        if (sidebar && sidebar.classList.contains("open")) {
            sidebar.classList.remove("open");
        }
    }
}

