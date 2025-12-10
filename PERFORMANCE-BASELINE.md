# Performance Baseline

**Date:** 2025-12-09
**Environment:** Development server (localhost:3000)
**Tool:** Lighthouse 13.0.1

> Note: These metrics are from the development server. Production builds typically perform 2-3x better due to minification, code splitting, and server optimizations.

---

## Baseline Metrics

### Homepage (/)

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Performance Score | 59/100 | 90+ | Needs Improvement |
| First Contentful Paint (FCP) | 1.3s | < 1.8s | Good |
| Largest Contentful Paint (LCP) | 3.5s | < 2.5s | Needs Improvement |
| Total Blocking Time (TBT) | 960ms | < 200ms | Poor |
| Cumulative Layout Shift (CLS) | 0 | < 0.1 | Excellent |
| Speed Index | 23.5s | < 3.4s | Poor (dev server) |
| Time to Interactive (TTI) | 8.2s | < 3.8s | Poor |

### Journal Page (/journal)

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Performance Score | 44/100 | 90+ | Needs Improvement |
| First Contentful Paint (FCP) | 1.2s | < 1.8s | Good |
| Largest Contentful Paint (LCP) | 11.2s | < 2.5s | Poor |
| Total Blocking Time (TBT) | 990ms | < 200ms | Poor |
| Cumulative Layout Shift (CLS) | 0 | < 0.1 | Excellent |
| Speed Index | 9.6s | < 3.4s | Poor |
| Time to Interactive (TTI) | 11.3s | < 3.8s | Poor |

---

## Key Issues Identified

### 1. Unused JavaScript (Critical)
- **Homepage:** 1,060 KiB unused JS
- **Journal:** 1,683 KiB unused JS
- **Action:** Bundle analyzer + code splitting

### 2. Total Blocking Time (Critical)
- ~1000ms on main thread blocking
- **Action:** React.memo for list components, lazy loading

### 3. Server Response Time (Dev Only)
- Homepage: 14.7s (first load, cold start)
- Journal: 5.9s
- **Note:** Production server will be much faster

### 4. LCP Issues
- Journal page LCP is 11.2s (database loading + rendering)
- **Action:** Skeleton loaders, pagination, virtual scrolling

### 5. Unused CSS (Minor)
- ~14 KiB unused CSS
- **Action:** PurgeCSS or Tailwind purge optimization

---

## Bundle Analysis (Production Build)

**Date:** 2025-12-09
**Tool:** @next/bundle-analyzer

### Page-Specific Bundle Sizes

| Page | Page JS | First Load JS | Notes |
|------|---------|---------------|-------|
| `/` (Homepage) | 10.7 kB | 124 kB | Good |
| `/journal` | 51.6 kB | 190 kB | Heaviest - framer-motion |
| `/theses` | 3.57 kB | 113 kB | Good |
| `/theses/[id]` | 13.8 kB | 144 kB | Moderate |
| `/theses/new` | 4.12 kB | 101 kB | Good |
| `/journal/new` | 7.29 kB | 104 kB | Good |
| `/insights` | 3.98 kB | 109 kB | Good |

### Shared Chunks

| Chunk | Size | Contents |
|-------|------|----------|
| 117-*.js | 31.7 kB | Shared components |
| fd9d1056-*.js | 53.6 kB | Framework code |
| Other shared | 1.96 kB | Utils |
| **Total Shared** | **87.3 kB** | |

### Key Findings

1. **Journal page is heaviest** at 51.6 kB (page-specific) due to:
   - SwipeableEntryCard with framer-motion
   - InlineEditModal
   - SearchFilters component

2. **Shared JS is reasonable** at 87.3 kB for a React/Next.js app

3. **Large dependencies** (estimated):
   - framer-motion: ~20-30 kB
   - date-fns: ~10-15 kB
   - lucide-react: ~5-10 kB

---

## Optimization Plan

### Priority 1: Bundle Size Reduction
- [x] Install bundle analyzer
- [x] Identify large dependencies (framer-motion is main culprit)
- [ ] Implement dynamic imports for heavy components (framer-motion)
- [ ] Code split non-critical paths

### Priority 2: React Optimization
- [x] Add React.memo to EntryCard components
- [x] Add React.memo to SwipeableEntryCard
- [x] Add React.memo to ThesisCard
- [ ] Memoize expensive computations
- [ ] Implement useCallback for handlers

### Priority 3: Image Optimization
- [x] Audit img tags - only user-uploaded previews (blob URLs, can't use next/image)
- [x] No static images need optimization
- N/A - Add lazy loading (not applicable)

### Priority 4: List Virtualization
- [x] Implement virtual scrolling for journal entries (react-window)
- [x] VirtualizedEntryList component with threshold (20+ entries)
- [ ] Add infinite scroll pagination (future enhancement)
- [ ] Reduce initial render items (future enhancement)

---

## Target Metrics (Post-Optimization)

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Performance Score | 44-59 | 85+ | +40% |
| LCP | 3.5-11.2s | < 2.5s | -70% |
| TBT | ~1000ms | < 300ms | -70% |
| TTI | 8-11s | < 4s | -50% |
| Bundle Size | 1.7MB | < 500KB | -70% |

---

## Measurement Methodology

```bash
# Run Lighthouse audit
npx lighthouse http://localhost:3000 \
  --output=json \
  --output-path=./lighthouse-report.json \
  --chrome-flags="--headless --no-sandbox" \
  --only-categories=performance

# Extract metrics
node -e "const r = require('./lighthouse-report.json');
console.log('Score:', Math.round(r.categories.performance.score * 100));
console.log('FCP:', r.audits['first-contentful-paint'].displayValue);
console.log('LCP:', r.audits['largest-contentful-paint'].displayValue);
console.log('TBT:', r.audits['total-blocking-time'].displayValue);"
```

---

## Notes

1. **Dev vs Production:** Development server has additional overhead (hot reload, source maps, no minification). Production builds should show 2-3x improvement.

2. **Database Impact:** Journal page LCP is affected by database query time. Consider:
   - Pagination (already implemented)
   - Caching API responses
   - Optimistic UI updates

3. **CLS is Excellent:** Layout stability is already perfect (0). This is due to proper skeleton loaders and consistent component sizing.

4. **FCP is Good:** Initial paint is fast (1.2-1.3s). The issue is post-FCP loading time.
