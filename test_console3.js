const { chromium } = require('playwright');

async function testConsole() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`CONSOLE ERROR: ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    errors.push(`PAGE ERROR: ${err.message}`);
  });
  
  try {
    await page.goto('http://localhost:8081/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const sidebar = await page.$('#sidebar');
    const toggleBtn = await page.$('#sidebarToggleBtn');
    const navInvoice = await page.$('#navInvoice');
    
    console.log('=== Mobile Viewport ===');
    const toggleVisibleMobile = await toggleBtn.isVisible();
    console.log('Toggle button visible on mobile:', toggleVisibleMobile);
    
    // Open sidebar
    await toggleBtn.click();
    await page.waitForTimeout(500);
    
    const sidebarClassOpen = await sidebar.getAttribute('class');
    console.log('Sidebar class after open:', sidebarClassOpen);
    
    // Click nav link and wait for navigation
    await navInvoice.click({ force: true });
    await page.waitForTimeout(1000); // Wait longer for any async operations
    
    // Check sidebar state
    const sidebarClassAfterNav = await sidebar.getAttribute('class');
    console.log('Sidebar class after nav click:', sidebarClassAfterNav);
    
    // Check view state
    const homeActive = await page.$eval('#home', el => el.classList.contains('active'));
    const newInvoiceActive = await page.$eval('#new-invoice', el => el.classList.contains('active'));
    console.log('Home active:', homeActive);
    console.log('New invoice active:', newInvoiceActive);
    
    // Check if sidebar closed
    const isSidebarOpen = sidebarClassAfterNav.includes('open');
    console.log('Sidebar still open after nav click:', isSidebarOpen);
    
    // Check computed styles
    const sidebarDisplay = await sidebar.evaluate(el => getComputedStyle(el).display);
    const sidebarTransform = await sidebar.evaluate(el => getComputedStyle(el).transform);
    console.log('Sidebar display:', sidebarDisplay);
    console.log('Sidebar transform:', sidebarTransform);
    
    console.log('\nErrors:');
    errors.forEach(e => console.log('  -', e));
    
  } catch (err) {
    console.error('Test error:', err);
  }
  
  await browser.close();
}

testConsole();
