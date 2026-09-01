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
    
    // Check if app is defined
    const appDefined = await page.evaluate('typeof window.app !== "undefined"');
    console.log('window.app defined:', appDefined);
    
    // Check if toggleSidebar function exists
    const toggleExists = await page.evaluate('typeof window.app?.toggleSidebar === "function"');
    console.log('toggleSidebar function exists:', toggleExists);
    
    // Check sidebar element
    const sidebar = await page.$('#sidebar');
    const sidebarClass = await sidebar.getAttribute('class');
    console.log('Sidebar class:', sidebarClass);
    
    // Check dashboard content margin
    const dcMargin = await page.evaluate(() => getComputedStyle(document.querySelector('.dashboard-content')).marginLeft);
    console.log('Dashboard content margin-left:', dcMargin);
    
    // Test clicking sidebar toggle
    const toggleBtn = await page.$('#sidebarToggleBtn');
    const toggleVisible = await toggleBtn.isVisible();
    console.log('Toggle button visible on desktop:', toggleVisible);
    
    // Test clicking navInvoice
    const navInvoice = await page.$('#navInvoice');
    await navInvoice.click();
    await page.waitForTimeout(500);
    
    const newInvoiceActive = await page.$eval('#new-invoice', el => el.classList.contains('active'));
    console.log('New invoice section active after click:', newInvoiceActive);
    
    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const toggleVisibleMobile = await toggleBtn.isVisible();
    console.log('Toggle button visible on mobile:', toggleVisibleMobile);
    
    if (toggleVisibleMobile) {
      await toggleBtn.click();
      await page.waitForTimeout(500);
      
      const sidebarClassMobile = await sidebar.getAttribute('class');
      console.log('Sidebar class after mobile toggle:', sidebarClassMobile);
      
      // Click nav on mobile
      await navInvoice.click();
      await page.waitForTimeout(500);
      
      const sidebarClassAfterNav = await sidebar.getAttribute('class');
      console.log('Sidebar class after nav click on mobile:', sidebarClassAfterNav);
      
      const newInvoiceActiveMobile = await page.$eval('#new-invoice', el => el.classList.contains('active'));
      console.log('New invoice active on mobile:', newInvoiceActiveMobile);
    }
    
    console.log('\nErrors:');
    errors.forEach(e => console.log('  -', e));
    
  } catch (err) {
    console.error('Test error:', err);
  }
  
  await browser.close();
}

testConsole();
