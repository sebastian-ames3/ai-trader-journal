const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 } // iPhone 14 Pro
  });
  const page = await context.newPage();

  // Capture network requests
  const requests = [];
  const jsResources = [];
  let totalBytes = 0;

  page.on('response', async (response) => {
    const request = response.request();
    const url = request.url();
    const resourceType = request.resourceType();

    try {
      const headers = await response.allHeaders();
      const contentLength = headers['content-length'];
      const size = contentLength ? parseInt(contentLength) : 0;

      requests.push({ url, resourceType, size });
      totalBytes += size;

      if (resourceType === 'script') {
        jsResources.push({ url, size });
      }
    } catch (e) {
      // Ignore errors from failed requests
    }
  });

  console.log('🚀 Starting Lighthouse Audit...\n');
  console.log('URL: http://localhost:3000');
  console.log('Date:', new Date().toISOString());
  console.log('Viewport: 390x844 (iPhone 14 Pro)\n');

  // Navigate and measure
  const startTime = Date.now();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  const loadTime = Date.now() - startTime;

  // Wait a bit more for any delayed scripts
  await page.waitForTimeout(2000);

  // Get Web Vitals and performance metrics
  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      // Get paint timing
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(e => e.name === 'first-contentful-paint');
      const lcp = paintEntries.find(e => e.name === 'largest-contentful-paint');

      // Get navigation timing
      const navTiming = performance.getEntriesByType('navigation')[0];

      // Get layout shift
      let cls = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        }
      });

      try {
        observer.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        // Layout shift not supported
      }

      // Get LCP via observer
      let lcpValue = 0;
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        lcpValue = lastEntry.startTime;
      });

      try {
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        // LCP not supported
      }

      // Get FID/TBT approximation via long tasks
      let tbt = 0;
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            tbt += entry.duration - 50;
          }
        }
      });

      try {
        longTaskObserver.observe({ type: 'longtask', buffered: true });
      } catch (e) {
        // Long tasks not supported
      }

      setTimeout(() => {
        resolve({
          fcp: fcp ? fcp.startTime : null,
          lcp: lcpValue || (lcp ? lcp.startTime : null),
          tti: navTiming ? navTiming.domInteractive : null,
          domContentLoaded: navTiming ? navTiming.domContentLoadedEventEnd : null,
          loadComplete: navTiming ? navTiming.loadEventEnd : null,
          cls: cls,
          tbt: tbt,
          transferSize: navTiming ? navTiming.transferSize : 0,
          encodedBodySize: navTiming ? navTiming.encodedBodySize : 0,
          decodedBodySize: navTiming ? navTiming.decodedBodySize : 0
        });
      }, 500);
    });
  });

  // Run Lighthouse accessibility checks manually
  const accessibilityIssues = await page.evaluate(() => {
    const issues = [];

    // Check for alt text on images
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
    if (imagesWithoutAlt.length > 0) {
      issues.push(`${imagesWithoutAlt.length} images missing alt text`);
    }

    // Check for labels on inputs
    const inputsWithoutLabels = Array.from(document.querySelectorAll('input')).filter(
      input => !input.labels || input.labels.length === 0
    );
    if (inputsWithoutLabels.length > 0) {
      issues.push(`${inputsWithoutLabels.length} inputs missing labels`);
    }

    // Check for heading hierarchy
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    if (headings.length > 0) {
      const firstHeading = headings[0];
      if (firstHeading.tagName !== 'H1') {
        issues.push('First heading is not H1');
      }
    }

    return issues;
  });

  // Console errors check
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Calculate scores (simplified lighthouse scoring)
  const fcpScore = metrics.fcp < 1500 ? 100 : metrics.fcp < 2500 ? 75 : metrics.fcp < 4000 ? 50 : 25;
  const lcpScore = metrics.lcp < 2500 ? 100 : metrics.lcp < 4000 ? 75 : metrics.lcp < 5000 ? 50 : 25;
  const clsScore = metrics.cls < 0.1 ? 100 : metrics.cls < 0.25 ? 75 : metrics.cls < 0.5 ? 50 : 25;
  const tbtScore = metrics.tbt < 200 ? 100 : metrics.tbt < 600 ? 75 : metrics.tbt < 1000 ? 50 : 25;

  const performanceScore = Math.round((fcpScore * 0.1 + lcpScore * 0.25 + clsScore * 0.15 + tbtScore * 0.3) / 0.8);
  const accessibilityScore = accessibilityIssues.length === 0 ? 100 : Math.max(70, 100 - accessibilityIssues.length * 5);

  // Format output
  console.log('='.repeat(60));
  console.log('LIGHTHOUSE BASELINE AUDIT');
  console.log('='.repeat(60));
  console.log();

  console.log('SCORES:');
  console.log(`- Performance: ${performanceScore}/100 ${getGrade(performanceScore)}`);
  console.log(`- Accessibility: ${accessibilityScore}/100 ${getGrade(accessibilityScore)}`);
  console.log(`- Best Practices: N/A (requires full Lighthouse)`);
  console.log(`- SEO: N/A (requires full Lighthouse)`);
  console.log();

  console.log('CORE WEB VITALS:');
  console.log(`- FCP: ${(metrics.fcp / 1000).toFixed(2)}s (target: < 1.5s) ${metrics.fcp < 1500 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`- LCP: ${(metrics.lcp / 1000).toFixed(2)}s (target: < 2.5s) ${metrics.lcp < 2500 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`- TTI: ${(metrics.tti / 1000).toFixed(2)}s (target: < 3.5s) ${metrics.tti < 3500 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`- TBT: ${metrics.tbt.toFixed(0)}ms (target: < 300ms) ${metrics.tbt < 300 ? '✅ GOOD' : '⚠️ NEEDS WORK'}`);
  console.log(`- CLS: ${metrics.cls.toFixed(3)} (target: < 0.1) ${metrics.cls < 0.1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log();

  console.log('BUNDLE ANALYSIS:');
  const totalJS = jsResources.reduce((sum, r) => sum + r.size, 0);
  const mainBundle = jsResources.find(r => r.url.includes('main') || r.url.includes('page'));
  console.log(`- Total JS: ${formatBytes(totalJS)}`);
  console.log(`- Main bundle: ${mainBundle ? formatBytes(mainBundle.size) : 'N/A'}`);
  console.log(`- Total requests: ${requests.length}`);
  console.log(`- Total page size: ${formatBytes(totalBytes)}`);
  console.log(`- Page load time: ${(loadTime / 1000).toFixed(2)}s`);
  console.log();

  console.log('RESOURCE BREAKDOWN:');
  const byType = {};
  requests.forEach(r => {
    byType[r.resourceType] = (byType[r.resourceType] || 0) + 1;
  });
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`  - ${type}: ${count} requests`);
  });
  console.log();

  if (consoleErrors.length > 0) {
    console.log('⚠️ CONSOLE ERRORS:');
    consoleErrors.slice(0, 5).forEach(err => {
      console.log(`  - ${err}`);
    });
    if (consoleErrors.length > 5) {
      console.log(`  ... and ${consoleErrors.length - 5} more`);
    }
    console.log();
  }

  if (accessibilityIssues.length > 0) {
    console.log('⚠️ ACCESSIBILITY ISSUES:');
    accessibilityIssues.forEach(issue => {
      console.log(`  - ${issue}`);
    });
    console.log();
  }

  console.log('RECOMMENDATIONS:');
  const recommendations = [];

  if (metrics.fcp > 1500) {
    recommendations.push(`1. Reduce FCP by optimizing critical rendering path (current: ${(metrics.fcp / 1000).toFixed(2)}s)`);
  }

  if (metrics.lcp > 2500) {
    recommendations.push(`${recommendations.length + 1}. Optimize LCP by lazy-loading images or using priority hints (current: ${(metrics.lcp / 1000).toFixed(2)}s)`);
  }

  if (metrics.tbt > 300) {
    recommendations.push(`${recommendations.length + 1}. Reduce Total Blocking Time by code-splitting and deferring non-critical JS (current: ${metrics.tbt.toFixed(0)}ms)`);
  }

  if (metrics.cls > 0.1) {
    recommendations.push(`${recommendations.length + 1}. Fix Cumulative Layout Shift by adding dimensions to images/elements (current: ${metrics.cls.toFixed(3)})`);
  }

  if (totalJS > 500000) {
    recommendations.push(`${recommendations.length + 1}. Reduce JavaScript bundle size (current: ${formatBytes(totalJS)})`);
  }

  if (accessibilityIssues.length > 0) {
    recommendations.push(`${recommendations.length + 1}. Fix accessibility issues: ${accessibilityIssues.join(', ')}`);
  }

  if (recommendations.length === 0) {
    console.log('✅ No critical issues found! Performance looks good.');
  } else {
    recommendations.forEach(rec => console.log(rec));
  }

  console.log();
  console.log('='.repeat(60));

  await browser.close();
})();

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getGrade(score) {
  if (score >= 90) return '🟢 A';
  if (score >= 80) return '🟡 B';
  if (score >= 70) return '🟠 C';
  if (score >= 60) return '🔴 D';
  return '🔴 F';
}
