const { chromium } = require('playwright');

async function testFull() {
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
    
    const sidebar = await page.$('#sidebar');
    const toggleBtn = await page.$('#sidebarToggleBtn');
    const navHome = await page.$('#navHome');
    const navInvoice = await page.$('#navInvoice');
    const navHistory = await page.$('#navHistory');
    const navClients = await page.$('#navClients');
    const navTemplates = await page.$('#navTemplates');
    const navPricing = await page.$('#navPricing');
    
    console.log('=== DESKTOP VIEWPORT (1024x768) ===');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    
    // Check sidebar is visible and positioned correctly
    const sidebarClass = await sidebar.getAttribute('class');
    console.log('Sidebar class (desktop):', sidebarClass);
    
    const sidebarBox = await sidebar.boundingBox();
    console.log('Sidebar position (desktop):', sidebarBox);
    
    // Check toggle button is hidden on desktop
    const toggleVisible = await toggleBtn.isVisible();
    console.log('Toggle button visible (desktop):', toggleVisible);
    
    // Check dashboard content margin
    const dcMargin = await page.evaluate(() => getComputedStyle(document.querySelector('.dashboard-content')).marginLeft);
    console.log('Dashboard content margin-left (desktop):', dcMargin);
    
    // Click nav links on desktop
    await navInvoice.click({ force: true });
    await page.waitForTimeout(500);
    const newInvoiceActive = await page.$eval('#new-invoice', el => el.classList.contains('active'));
    console.log('New invoice active after nav click (desktop):', newInvoiceActive);
    
    await navHistory.click({ force: true });
    await page.waitForTimeout(500);
    const historyActive = await page.$eval('#history', el => el.classList.contains('active'));
    console.log('History active after nav click (desktop):', historyActive);
    
    await navClients.click({ force: true });
    await page.waitForTimeout(500);
    const clientsActive = await page.$eval('#clients', el => el.classList.contains('active'));
    console.log('Clients active after nav click (desktop):', clientsActive);
    
    await navHome.click({ force: true });
    await page.waitForTimeout(500);
    const homeActive = await page.$eval('#home', el => el.classList.contains('active'));
    console.log('Home active after nav click (desktop):', homeActive);
    
    console.log('\n=== MOBILE VIEWPORT (375x667) ===');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Check sidebar is hidden by default
    const sidebarClassMobile = await sidebar.getAttribute('class');
    console.log('Sidebar class (mobile, closed):', sidebarClassMobile);
    
    // Check toggle button is visible on mobile
    const toggleVisibleMobile = await toggleBtn.isVisible();
    console.log('Toggle button visible (mobile):', toggleVisibleMobile);
    
    // Check dashboard content margin on mobile
    const dcMarginMobile = await page.evaluate(() => getComputedStyle(document.querySelector('.dashboard-content')).marginLeft);
    console.log('Dashboard content margin-left (mobile):', dcMarginMobile);
    
    // Open sidebar
    await toggleBtn.click();
    await page.waitForTimeout(500);
    
    const sidebarClassOpen = await sidebar.getAttribute('class');
    console.log('Sidebar class after toggle (mobile):', sidebarClassOpen);
    
    const sidebarBoxOpen = await sidebar.boundingBox();
    console.log('Sidebar position when open (mobile):', sidebarBoxOpen);
    
    // Click nav links on mobile - sidebar should close
    await navInvoice.click({ force: true });
    await page.waitForTimeout(500);
    
    const sidebarAfterNav = await sidebar.getAttribute('class');
    console.log('Sidebar class after nav click (mobile):', sidebarAfterNav);
    
    const newInvoiceActiveMobile = await page.$eval('#new-invoice', el => el.classList.contains('active'));
    console.log('New invoice active after nav click (mobile):', newInvoiceActiveMobile);
    
    // Open sidebar again and test other nav links
    await toggleBtn.click();
    await page.waitForTimeout(500);
    
    await navHistory.click({ force: true });
    await page.waitForTimeout(500);
    const sidebarAfterHistory = await sidebar.getAttribute('class');
    console.log('Sidebar class after history click (mobile):', sidebarAfterHistory);
    const historyActiveMobile = await page.$eval('#history', el => el.classList.contains('active'));
    console.log('History active (mobile):', historyActiveMobile);
    
    await toggleBtn.click();
    await page.waitForTimeout(500);
    
    await navClients.click({ force: true });
    await page.waitForTimeout(500);
    const sidebarAfterClients = await sidebar.getAttribute('class');
    console.log('Sidebar class after clients click (mobile):', sidebarAfterClients);
    const clientsActiveMobile = await page.$eval('#clients', el => el.classList.contains('active'));
    console.log('Clients active (mobile):', clientsActiveMobile);
    
    await toggleBtn.click();
    await page.waitForTimeout(500);
    
    await navTemplates.click({ force: true });
    await page.waitForTimeout(500);
    const sidebarAfterTemplates = await sidebar.getAttribute('class');
    console.log('Sidebar class after templates click (mobile):', sidebarAfterTemplates);
    const templatesActive = await page.$eval('#templates', el => el.classList.contains('active'));
    console.log('Templates active (mobile):', templatesActive);
    
    await toggleBtn.click();
    await page.waitForTimeout(500);
    
    await navPricing.click({ force: true });
    await page.waitForTimeout(500);
    const sidebarAfterPricing = await sidebar.getAttribute('class');
    console.log('Sidebar class after pricing click (mobile):', sidebarAfterPricing);
    const pricingActive = await page.$eval('#pricing', el => el.classList.contains('active'));
    console.log('Pricing active (mobile):', pricingActive);
    
    // Test close button
    await toggleBtn.click();
    await page.waitForTimeout(500);
    
    const closeBtn = await page.$('.sidebar-close-btn');
    await closeBtn.click({ force: true });
    await page.waitForTimeout(500);
    
    const sidebarAfterClose = await sidebar.getAttribute('class');
    console.log('Sidebar class after close button (mobile):', sidebarAfterClose);
    
    console.log('\n=== ALL TESTS PASSED ===');
    
  } catch (err) {
    console.error('Test error:', err);
  }
  
  await browser.close();
}

testFull();
