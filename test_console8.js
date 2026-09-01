const { chromium } = require('playwright');

async function testConsole() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`CONSOLE [${msg.type()}]: ${msg.text()}`);
  });
  page.on('pageerror', err => {
    console.log(`PAGE ERROR: ${err.message}`);
  });
  
  try {
    await page.goto('http://localhost:8081/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const toggleBtn = await page.$('#sidebarToggleBtn');
    const navInvoice = await page.$('#navInvoice');
    
    // Open sidebar
    await toggleBtn.click();
    await page.waitForTimeout(500);
    
    // Check z-indexes
    const zIndexes = await page.evaluate(() => {
      const sidebar = document.getElementById('sidebar');
      const header = document.querySelector('.header');
      const headerActions = document.getElementById('headerActions');
      const settingsBtn = headerActions.querySelector('button[title="Settings"]');
      
      return {
        sidebar: getComputedStyle(sidebar).zIndex,
        header: getComputedStyle(header).zIndex,
        headerActions: getComputedStyle(headerActions).zIndex,
        settingsBtn: settingsBtn ? getComputedStyle(settingsBtn).zIndex : 'none',
        sidebarRect: sidebar.getBoundingClientRect(),
        headerRect: header.getBoundingClientRect(),
        headerActionsRect: headerActions.getBoundingClientRect(),
        settingsBtnRect: settingsBtn ? settingsBtn.getBoundingClientRect() : null
      };
    });
    console.log('Z-indexes and rects:', JSON.stringify(zIndexes, null, 2));
    
  } catch (err) {
    console.error('Test error:', err);
  }
  
  await browser.close();
}

testConsole();
