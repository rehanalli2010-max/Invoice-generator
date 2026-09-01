const { chromium } = require('playwright');

async function testDesktopToggle() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`CONSOLE [${msg.type()}]: ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    console.log(`PAGE ERROR: ${err.message}`);
  });
  
  try {
    await page.goto('http://localhost:8081/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Test on desktop
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    
    const sidebar = await page.$('#sidebar');
    const toggleBtn = await page.$('#sidebarToggleBtn');
    const navInvoice = await page.$('#navInvoice');
    const closeBtn = await page.$('.sidebar-close-btn');
    
    console.log('=== DESKTOP VIEWPORT (1024x768) ===');
    
    // Check initial state
    const sidebarClassInitial = await sidebar.getAttribute('class');
    console.log('Sidebar class (initial):', sidebarClassInitial);
    
    // On desktop, the sidebar should NOT be togglable (no toggle button)
    // But we can test if clicking the close button works (it shouldn't be visible)
    const closeVisible = await closeBtn.isVisible();
    console.log('Close button visible (desktop):', closeVisible);
    
    const toggleVisible = await toggleBtn.isVisible();
    console.log('Toggle button visible (desktop):', toggleVisible);
    
    // Test clicking nav links on desktop
    await navInvoice.click({ force: true });
    await page.waitForTimeout(500);
    
    const newInvoiceActive = await page.$eval('#new-invoice', el => el.classList.contains('active'));
    console.log('New invoice active after nav click (desktop):', newInvoiceActive);
    
    // Test with smaller desktop-like viewport (but > 768px)
    await page.setViewportSize({ width: 900, height: 700 });
    await page.waitForTimeout(500);
    
    const sidebarClass900 = await sidebar.getAttribute('class');
    console.log('Sidebar class (900px wide):', sidebarClass900);
    
    const toggleVisible900 = await toggleBtn.isVisible();
    console.log('Toggle button visible (900px):', toggleVisible900);
    
    console.log('\n=== TESTS COMPLETED ===');
    
  } catch (err) {
    console.error('Test error:', err);
  }
  
  await browser.close();
}

testDesktopToggle();
