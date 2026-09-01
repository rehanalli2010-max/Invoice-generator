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
    
    // Test the exact onclick handler
    console.log('=== Executing onclick handler directly ===');
    await page.evaluate(() => {
      const handler = document.getElementById('navInvoice').onclick;
      if (handler) {
        console.log('onclick handler found');
        handler();
      } else {
        console.log('onclick handler NOT found');
      }
    });
    await page.waitForTimeout(1000);
    
    // Check view state
    const homeActive = await page.$eval('#home', el => el.classList.contains('active'));
    const newInvoiceActive = await page.$eval('#new-invoice', el => el.classList.contains('active'));
    console.log('Home active:', homeActive);
    console.log('New invoice active:', newInvoiceActive);
    
    // Check sidebar
    const sidebar = await page.$('#sidebar');
    const sidebarClass = await sidebar.getAttribute('class');
    console.log('Sidebar class:', sidebarClass);
    
  } catch (err) {
    console.error('Test error:', err);
  }
  
  await browser.close();
}

testConsole();
