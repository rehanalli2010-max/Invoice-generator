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
    
    // Click templates
    console.log('=== Clicking navTemplates ===');
    await navTemplates.click({ force: true });
    await page.waitForTimeout(500);
    
    // Check templates
    const templates = await page.$('#templates');
    const templatesClass = await templates.getAttribute('class');
    const templatesDisplay = await templates.evaluate(el => getComputedStyle(el).display);
    const templatesActive = await page.$eval('#templates', el => el.classList.contains('active'));
    console.log('Templates class:', templatesClass);
    console.log('Templates display:', templatesDisplay);
    console.log('Templates active:', templatesActive);
    
    // Check sidebar
    const sidebar = await page.$('#sidebar');
    const sidebarClass = await sidebar.getAttribute('class');
    console.log('Sidebar class:', sidebarClass);
    
    // Open sidebar again and click pricing
    await toggleBtn.click();
    await page.waitForTimeout(500);
    
    console.log('=== Clicking navPricing ===');
    await navPricing.click({ force: true });
    await page.waitForTimeout(500);
    
    // Check pricing
    const pricing = await page.$('#pricing');
    const pricingClass = await pricing.getAttribute('class');
    const pricingDisplay = await pricing.evaluate(el => getComputedStyle(el).display);
    const pricingActive = await page.$eval('#pricing', el => el.classList.contains('active'));
    console.log('Pricing class:', pricingClass);
    console.log('Pricing display:', pricingDisplay);
    console.log('Pricing active:', pricingActive);
    
  } catch (err) {
    console.error('Test error:', err);
  }
  
  await browser.close();
}

testTemplates();
