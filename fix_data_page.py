import os
import re

html_files = [f for f in os.listdir('.') if f.endswith('.html') and os.path.isfile(f)]

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Need to find the sidebar links and add data-page attribute
    # They usually look like:
    # <a href="..." class="sidebar-link...">
    #   <span class="sidebar-icon"...>📊</span>
    #   <span>Home</span>
    # </a>

    # Let's replace specifically for each known link
    # For Home: <span>Home</span> or <span data-i18n="nav.home">Home</span>
    
    # Actually, a simpler way is to regex search for the link block containing specific text.
    
    # Home:
    content = re.sub(r'(<a[^>]*class="sidebar-link[^>]*?)(>[\s]*<span[^>]*>.*?📊.*?</span[\s]*>[\s]*<span[^>]*>Home</span)', r'\1 data-page="home"\2', content, flags=re.DOTALL)
    
    # New Invoice:
    content = re.sub(r'(<a[^>]*class="sidebar-link[^>]*?)(>[\s]*<span[^>]*>.*?📝.*?</span[\s]*>[\s]*<span[^>]*>New Invoice</span)', r'\1 data-page="new-invoice"\2', content, flags=re.DOTALL)
    
    # History:
    content = re.sub(r'(<a[^>]*class="sidebar-link[^>]*?)(>[\s]*<span[^>]*>.*?📋.*?</span[\s]*>[\s]*<span[^>]*>History</span)', r'\1 data-page="history"\2', content, flags=re.DOTALL)
    
    # Clients:
    content = re.sub(r'(<a[^>]*class="sidebar-link[^>]*?)(>[\s]*<span[^>]*>.*?👥.*?</span[\s]*>[\s]*<span[^>]*>Clients</span)', r'\1 data-page="clients"\2', content, flags=re.DOTALL)
    
    # Templates:
    content = re.sub(r'(<a[^>]*class="sidebar-link[^>]*?)(>[\s]*<span[^>]*>.*?🏢.*?</span[\s]*>[\s]*<span[^>]*>Templates</span)', r'\1 data-page="templates"\2', content, flags=re.DOTALL)
    
    # Pricing:
    content = re.sub(r'(<a[^>]*class="sidebar-link[^>]*?)(>[\s]*<span[^>]*>.*?💎.*?</span[\s]*>[\s]*<span[^>]*>Pricing</span)', r'\1 data-page="pricing"\2', content, flags=re.DOTALL)

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

