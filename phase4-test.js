const playwright = require('playwright');
const path = require('path');

(async () => {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  const page = await context.newPage();

  const baseUrl = 'http://localhost:3004';

  const pages = [
    { name: 'AI Coach', url: '/coach' },
    { name: 'Coach Goals', url: '/coach/goals' },
    { name: 'Sharing', url: '/sharing' },
    { name: 'Home/Dashboard', url: '/' },
    { name: 'Theses', url: '/theses' }
  ];

  const allResults = [];

  for (const testPage of pages) {
    console.log('========================================');
    console.log('Testing:', testPage.name, '(' + testPage.url + ')');
    console.log('========================================');

    const consoleMessages = [];
    const errors = [];

    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      consoleMessages.push({ type, text });
      if (type === 'error') {
        console.log('[CONSOLE ERROR]', text);
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
      console.log('[PAGE ERROR]', error.message);
    });

    try {
      const response = await page.goto(baseUrl + testPage.url, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      await page.waitForTimeout(2000);

      const status = response.status();
      const title = await page.title();

      console.log('Status Code:', status);
      console.log('Page Title:', title);
      console.log('Console Errors:', consoleMessages.filter(m => m.type === 'error').length);
      console.log('Page Errors:', errors.length);

      allResults.push({
        name: testPage.name,
        url: testPage.url,
        status,
        title,
        consoleErrorCount: consoleMessages.filter(m => m.type === 'error').length,
        pageErrorCount: errors.length,
        success: status === 200 && errors.length === 0
      });

    } catch (error) {
      console.log('[NAVIGATION ERROR]', error.message);
      allResults.push({
        name: testPage.name,
        url: testPage.url,
        error: error.message,
        success: false
      });
    }
  }

  await browser.close();

  console.log('\n\n========================================');
  console.log('FINAL SUMMARY');
  console.log('========================================');

  allResults.forEach(result => {
    const icon = result.success ? '✓' : '✗';
    console.log(icon, result.name + ':', result.status || 'FAILED', '-', result.consoleErrorCount || 0, 'console errors,', result.pageErrorCount || 0, 'page errors');
  });

  const allSuccess = allResults.every(r => r.success);
  console.log('\nOverall:', allSuccess ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗');
})();
