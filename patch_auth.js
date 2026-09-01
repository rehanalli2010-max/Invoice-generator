const fs = require('fs');

const files = ['clients.html', 'history.html'];
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if it already has the auth section
    if (!content.includes('id="sidebarAuthSection"')) {
        const authHtml = `                </a>
                <div class="sidebar-divider"></div>
                <div id="sidebarAuthSection">
                    <button class="btn btn-primary sidebar-btn" onclick="window.app && window.app.showAuthModal && window.app.showAuthModal()" data-i18n="nav.signIn">Sign In / Sign Up</button>
                </div>`;
        
        // Replace the end of the pricing link
        content = content.replace(
            /<span>Pricing<\/span>\s*<\/a>/,
            `<span>Pricing</span>\n${authHtml}`
        );
        
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Patched ${file}`);
    } else {
        console.log(`${file} already has auth section`);
    }
}
