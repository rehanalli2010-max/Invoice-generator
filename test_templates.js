const { chromium } = require('playwright');

async function testTemplates() {
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
    
    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const toggleBtn = await page.$('#sidebarToggleBtn');
    const navTemplates = await page.$('#navTemplates');
    const navPricing = await page.$('#navPricing');
    
    // Open sidebar
    await toggleBtn.click();
    await page.waitForTimeout(500);
    
    // Check what showTemplatesView and showPricingView do
    console.log('=== Checking showTemplatesView function ===');
    await page.evaluate(() => {
      if (window.app && window.app.showTemplatesView) {
        console.log('showTemplatesView exists');
        window.app.showTemplatesView();
      } else {
        console.log('showTemplatesView NOT found');
      }
    });
    await page.waitForTimeout(500);
    
    const templatesActive = await page.$eval('#templates', el => el.classList.contains('active'));
    console.log('Templates active:', templatesActive);
    
    const sidebar = await page.$('#sidebar');
    const sidebarClass = await sidebar.getAttribute('class');
    console.log('Sidebar class:', sidebarClass);
    
    // Test showPricingView
    await toggleBtn.click();
    await page.waitForTimeout(500);
    
    console.log('=== Checking showPricingView function ===');
    await page.evaluate(() => {
      if (window.app && window.app.showPricingView) {
        console.log('showPricingView exists');
        window.app.showPricingView();
      } else {
        console.log('showPricingView NOT found');
      }
    });
    await page.waitForTimeout(500);
    
    const pricingActive = await page.$eval('#pricing', el => el.classList.contains('active'));
    console.log('Pricing active:', pricingActive);
    
    const sidebarClass2 = await sidebar.getAttribute('class');
    console.log('Sidebar class:', sidebarClass2);
    
  } catch (err) {
    console.error('Test error:', err);
  }
  
  await browser.close();
}

testTemplates();
