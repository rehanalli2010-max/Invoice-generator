import re

files = ['clients.html', 'history.html']
for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if it already has the auth section
    if 'id="sidebarAuthSection"' not in content:
        auth_html = """                </a>
                <div class="sidebar-divider"></div>
                <div id="sidebarAuthSection">
                    <button class="btn btn-primary sidebar-btn" onclick="window.app && window.app.showAuthModal && window.app.showAuthModal()" data-i18n="nav.signIn">Sign In / Sign Up</button>
                </div>"""
        
        # Replace the end of the pricing link
        content = re.sub(
            r'<span>Pricing</span>\s*</a>',
            r'<span>Pricing</span>\n' + auth_html,
            content
        )
        
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Patched {file}")
    else:
        print(f"{file} already has auth section")
