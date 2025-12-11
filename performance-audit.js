const { chromium } = require('playwright');

async function runPerformanceAudit() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 } // iPhone 14 Pro
  });
  const page = await context.newPage();

  // Track network requests
  const requests = [];
  const jsRequests = [];
  let totalJSSize = 0;

  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType()
    });
  });

  page.on('response', async response => {
    const request = response.request();
    const resourceType = request.resourceType();
    const url = request.url();

    if (resourceType === 'script' || url.endsWith('.js')) {
      try {
        const body = await response.body();
        const size = body.length;
        totalJSSize += size;
        jsRequests.push({
          url: url.split('/').pop() || url,
          size: (size / 1024).toFixed(2) + ' KB'
        });
      } catch (e) {
        // Some responses can't be read
      }
    }
  });

  // Track console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  console.log('Starting performance audit...\n');
  console.log('Target URL: http://localhost:3000');
  console.log('Viewport: 390x844 (iPhone 14 Pro)\n');

  // Navigate and collect metrics
  const startTime = Date.now();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  const loadTime = Date.now() - startTime;

  // Get Web Vitals using Performance API
  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      const result = {
        fcp: null,
        lcp: null,
        cls: null,
        fid: null,
        ttfb: null,
        domContentLoaded: null,
        loadComplete: null
      };

      // Get Navigation Timing
      const navTiming = performance.getEntriesByType('navigation')[0];
      if (navTiming) {
        result.ttfb = navTiming.responseStart - navTiming.requestStart;
        result.domContentLoaded = navTiming.domContentLoadedEventEnd - navTiming.fetchStart;
        result.loadComplete = navTiming.loadEventEnd - navTiming.fetchStart;
      }

      // Get Paint Timing
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          result.fcp = entry.startTime;
        }
      });

      // Get LCP using PerformanceObserver (if available)
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          result.lcp = lastEntry.renderTime || lastEntry.loadTime;
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        // LCP might not be available
      }

      // Wait a bit for LCP to be captured
      setTimeout(() => {
        resolve(result);
      }, 2000);
    });
  });

  // Get resource timing
  const resourceStats = await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource');
    const stats = {
      total: resources.length,
      byType: {},
      totalSize: 0
    };

    resources.forEach(resource => {
      const type = resource.initiatorType || 'other';
      if (!stats.byType[type]) {
        stats.byType[type] = { count: 0, size: 0 };
      }
      stats.byType[type].count++;
      if (resource.transferSize) {
        stats.byType[type].size += resource.transferSize;
        stats.totalSize += resource.transferSize;
      }
    });

    return stats;
  });

  // Format results
  console.log('='.repeat(80));
  console.log('PERFORMANCE AUDIT RESULTS');
  console.log('='.repeat(80));
  console.log();

  console.log('CORE WEB VITALS');
  console.log('-'.repeat(80));
  console.log(`First Contentful Paint (FCP):     ${metrics.fcp ? (metrics.fcp / 1000).toFixed(3) + 's' : 'N/A'} ${metrics.fcp && metrics.fcp < 1500 ? '✓ GOOD' : '⚠ NEEDS IMPROVEMENT'} (target: < 1.5s)`);
  console.log(`Largest Contentful Paint (LCP):   ${metrics.lcp ? (metrics.lcp / 1000).toFixed(3) + 's' : 'N/A'} ${metrics.lcp && metrics.lcp < 2500 ? '✓ GOOD' : '⚠ NEEDS IMPROVEMENT'} (target: < 2.5s)`);
  console.log(`Time to First Byte (TTFB):        ${metrics.ttfb ? (metrics.ttfb / 1000).toFixed(3) + 's' : 'N/A'}`);
  console.log(`DOM Content Loaded:               ${metrics.domContentLoaded ? (metrics.domContentLoaded / 1000).toFixed(3) + 's' : 'N/A'}`);
  console.log(`Load Complete:                    ${metrics.loadComplete ? (metrics.loadComplete / 1000).toFixed(3) + 's' : 'N/A'}`);
  console.log(`Total Load Time:                  ${(loadTime / 1000).toFixed(3)}s`);
  console.log();

  console.log('JAVASCRIPT BUNDLE SIZE');
  console.log('-'.repeat(80));
  console.log(`Total JS Size:                    ${(totalJSSize / 1024).toFixed(2)} KB`);
  console.log(`Target:                           < 300 KB ${totalJSSize < 300 * 1024 ? '✓' : '⚠'}`);
  console.log();
  console.log('Top 10 JavaScript Files:');
  jsRequests
    .sort((a, b) => parseFloat(b.size) - parseFloat(a.size))
    .slice(0, 10)
    .forEach((req, i) => {
      console.log(`  ${i + 1}. ${req.url.substring(0, 60).padEnd(60)} ${req.size.padStart(12)}`);
    });
  console.log();

  console.log('NETWORK REQUESTS');
  console.log('-'.repeat(80));
  console.log(`Total Requests:                   ${requests.length}`);
  console.log(`Total Transfer Size:              ${(resourceStats.totalSize / 1024).toFixed(2)} KB`);
  console.log();
  console.log('Requests by Type:');
  Object.entries(resourceStats.byType)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([type, data]) => {
      console.log(`  ${type.padEnd(20)} ${String(data.count).padStart(4)} requests  ${(data.size / 1024).toFixed(2).padStart(10)} KB`);
    });
  console.log();

  console.log('CONSOLE ERRORS');
  console.log('-'.repeat(80));
  if (consoleErrors.length === 0) {
    console.log('✓ No console errors detected');
  } else {
    console.log(`⚠ ${consoleErrors.length} console error(s) detected:`);
    consoleErrors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error.substring(0, 100)}${error.length > 100 ? '...' : ''}`);
    });
  }
  console.log();

  console.log('PERFORMANCE SCORE SUMMARY');
  console.log('-'.repeat(80));

  let score = 100;
  const issues = [];

  if (metrics.fcp && metrics.fcp > 1500) {
    score -= 15;
    issues.push('FCP > 1.5s');
  }
  if (metrics.lcp && metrics.lcp > 2500) {
    score -= 20;
    issues.push('LCP > 2.5s');
  }
  if (totalJSSize > 300 * 1024) {
    score -= 15;
    issues.push('JS bundle > 300 KB');
  }
  if (requests.length > 50) {
    score -= 10;
    issues.push('Too many requests (> 50)');
  }
  if (consoleErrors.length > 0) {
    score -= 10;
    issues.push('Console errors present');
  }

  console.log(`Overall Score: ${score}/100 ${score >= 90 ? '✓ EXCELLENT' : score >= 70 ? '⚠ GOOD' : '❌ NEEDS WORK'}`);
  console.log();

  if (issues.length > 0) {
    console.log('Issues Found:');
    issues.forEach(issue => console.log(`  • ${issue}`));
  } else {
    console.log('✓ No performance issues detected!');
  }

  console.log();
  console.log('='.repeat(80));
  console.log(`Audit completed at ${new Date().toLocaleString()}`);
  console.log('='.repeat(80));

  await browser.close();
}

runPerformanceAudit().catch(console.error);
