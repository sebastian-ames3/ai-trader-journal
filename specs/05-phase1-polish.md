# PRD: Phase 1 MVP Polish Features

## Overview

This document covers the remaining Phase 1 features needed to polish the MVP before Phase 2 engagement features.

**Features Covered:**
1. Guided Entry Mode (Issue #35)
2. PWA/Offline Support (Issue #36)
3. Performance Optimization (Issue #39)
4. Inline Quick Edit (Issue #40)

**Note:** Dark Mode (Issue #37) is already implemented.

---

## Feature 1: Guided Entry Mode

### Problem Statement
New users face a blank textarea and don't know what to write. Experienced journalers sometimes want structure to ensure they capture important aspects of their thinking.

### Solution
A step-by-step wizard that guides users through structured reflection with prompts tailored to entry type.

### User Stories
1. As a new user, I want prompts to help me know what to journal about.
2. As an experienced trader, I want a structured reflection template after trades.
3. As a user, I want to switch between guided and freeform modes easily.

### Feature Specification

**Entry Points:**
- Toggle on new entry page: [Freeform] [Guided]
- Default: Freeform for returning users, Guided for new users (< 5 entries)

**Guided Flow by Entry Type:**

**TRADE_IDEA:**
```
Step 1: What's the ticker? [TICKER INPUT]
Step 2: What's your thesis? (Why do you like this trade?)
Step 3: What's your conviction level? [LOW] [MEDIUM] [HIGH]
Step 4: What could go wrong? (Risk factors)
Step 5: What's your target? (Optional: price target, timeframe)
```

**TRADE (Executed):**
```
Step 1: What did you trade? [TICKER] [DIRECTION: BUY/SELL]
Step 2: Why did you enter? (What triggered the decision?)
Step 3: How are you feeling about it? [MOOD SELECTOR]
Step 4: What's your plan? (Target, stop-loss, timeframe)
Step 5: Anything else? (Optional notes)
```

**REFLECTION:**
```
Step 1: What are you reflecting on? [TICKER or GENERAL]
Step 2: What happened?
Step 3: What did you do well?
Step 4: What would you do differently?
Step 5: Key takeaway?
```

**OBSERVATION:**
```
Step 1: What caught your attention?
Step 2: Why is it interesting?
Step 3: Any action items? (Optional)
```

**UI Design:**
```
┌─────────────────────────────────┐
│  ← Back    Guided Entry    2/5  │
├─────────────────────────────────┤
│                                 │
│  What's your thesis?            │
│  Why do you like this trade?    │
│                                 │
│  ┌─────────────────────────────┐│
│  │                             ││
│  │  [Auto-expanding textarea]  ││
│  │                             ││
│  └─────────────────────────────┘│
│                                 │
│  💡 Tip: Be specific about     │
│  catalysts and timeframe       │
│                                 │
│  ┌─────────────────────────────┐│
│  │    [Back]      [Next →]     ││
│  └─────────────────────────────┘│
│                                 │
│  ○ ● ○ ○ ○  (progress dots)    │
└─────────────────────────────────┘
```

**Implementation:**

```typescript
// components/GuidedEntryWizard.tsx
interface GuidedStep {
  id: string;
  question: string;
  hint?: string;
  inputType: 'textarea' | 'ticker' | 'mood' | 'conviction' | 'select';
  required: boolean;
  options?: string[];
}

const TRADE_IDEA_STEPS: GuidedStep[] = [
  { id: 'ticker', question: "What's the ticker?", inputType: 'ticker', required: true },
  { id: 'thesis', question: "What's your thesis?", hint: "Why do you like this trade?", inputType: 'textarea', required: true },
  { id: 'conviction', question: "What's your conviction level?", inputType: 'conviction', required: true },
  { id: 'risks', question: "What could go wrong?", hint: "Risk factors to consider", inputType: 'textarea', required: false },
  { id: 'target', question: "What's your target?", hint: "Price target, timeframe (optional)", inputType: 'textarea', required: false }
];
```

**Data Output:**
Guided entries compile into a structured format stored in the same Entry model:
```typescript
{
  type: 'TRADE_IDEA',
  ticker: 'NVDA',
  content: `**Thesis:** [user input]

**Risk Factors:** [user input]

**Target:** [user input]`,
  conviction: 'HIGH',
  mood: 'CONFIDENT',
  // ... AI analysis runs on compiled content
}
```

### Tasks

- [ ] **GUIDE-1**: Create GuidedEntryWizard component with step navigation
- [ ] **GUIDE-2**: Define step configurations for all 4 entry types
- [ ] **GUIDE-3**: Add Guided/Freeform toggle to new entry page
- [ ] **GUIDE-4**: Implement step-by-step UI with progress indicator
- [ ] **GUIDE-5**: Compile guided responses into entry content
- [ ] **GUIDE-6**: Track guided vs freeform usage analytics
- [ ] **GUIDE-7**: A/B test completion rates

---

## Feature 2: PWA/Offline Support

### Problem Statement
Users need to journal when they don't have internet access (subway, airplane, poor connectivity). Currently, the app fails without a connection.

### Solution
Full PWA implementation with offline-first architecture, background sync, and installability.

### User Stories
1. As a trader on the subway, I want to write journal entries offline.
2. As a user, I want my entries to sync when I regain connectivity.
3. As a mobile user, I want to install the app to my home screen.

### Feature Specification

**PWA Manifest (already exists):**
- App name, icons, theme color - ✅ Already configured
- Display: standalone - ✅ Already configured

**Service Worker Enhancement:**

```javascript
// public/sw.js - Enhanced for offline support

const CACHE_NAME = 'trader-journal-v1';
const STATIC_ASSETS = [
  '/',
  '/journal',
  '/journal/new',
  '/insights',
  '/offline.html',
  // ... static assets
];

// Cache static assets on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Network-first with cache fallback for API
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/offline.html'))
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then((response) => response || fetch(event.request))
    );
  }
});

// Background sync for offline entries
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-entries') {
    event.waitUntil(syncOfflineEntries());
  }
});
```

**Offline Entry Queue (IndexedDB):**

```typescript
// lib/offlineQueue.ts
import Dexie from 'dexie';

interface OfflineEntry {
  id: string;
  data: EntryCreateInput;
  createdAt: Date;
  synced: boolean;
}

class OfflineDatabase extends Dexie {
  entries!: Dexie.Table<OfflineEntry, string>;

  constructor() {
    super('TraderJournalOffline');
    this.version(1).stores({
      entries: 'id, createdAt, synced'
    });
  }
}

export const offlineDb = new OfflineDatabase();

export async function queueEntryForSync(entry: EntryCreateInput) {
  await offlineDb.entries.add({
    id: crypto.randomUUID(),
    data: entry,
    createdAt: new Date(),
    synced: false
  });

  // Request background sync
  if ('serviceWorker' in navigator && 'sync' in registration) {
    await registration.sync.register('sync-entries');
  }
}

export async function syncOfflineEntries() {
  const pending = await offlineDb.entries.where('synced').equals(false).toArray();

  for (const entry of pending) {
    try {
      await fetch('/api/entries', {
        method: 'POST',
        body: JSON.stringify(entry.data)
      });
      await offlineDb.entries.update(entry.id, { synced: true });
    } catch (error) {
      console.error('Sync failed for entry:', entry.id);
    }
  }
}
```

**Offline UI Indicators:**

```typescript
// components/OfflineIndicator.tsx (enhance existing)
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending entries
    offlineDb.entries.where('synced').equals(false).count()
      .then(setPendingCount);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50">
      {!isOnline && (
        <Alert variant="warning">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You're offline. Entries will sync when you reconnect.
          </AlertDescription>
        </Alert>
      )}
      {pendingCount > 0 && (
        <Alert>
          <CloudUpload className="h-4 w-4" />
          <AlertDescription>
            {pendingCount} entries waiting to sync...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

**Install Prompt:**
```typescript
// components/InstallPrompt.tsx (enhance existing)
// Already implemented - just needs testing
```

### Tasks

- [ ] **PWA-1**: Enhance service worker with proper caching strategy
- [ ] **PWA-2**: Implement IndexedDB offline queue with Dexie
- [ ] **PWA-3**: Add background sync registration
- [ ] **PWA-4**: Create offline.html fallback page
- [ ] **PWA-5**: Enhance OfflineIndicator with pending count
- [ ] **PWA-6**: Test offline entry creation flow
- [ ] **PWA-7**: Test sync on reconnection
- [ ] **PWA-8**: Verify PWA installability on iOS and Android
- [ ] **PWA-9**: Add "Sync Now" manual trigger option

---

## Feature 3: Performance Optimization

### Problem Statement
Initial page loads can be slow, especially on mobile. Large bundle sizes and unnecessary re-renders impact user experience.

### Solution
Comprehensive performance optimization including code splitting, lazy loading, and render optimization.

### Target Metrics
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Bundle size: < 200KB initial JS

### Optimization Areas

**1. Code Splitting:**
```typescript
// Lazy load heavy components
const WeeklyInsights = dynamic(() => import('@/components/WeeklyInsights'), {
  loading: () => <InsightsSkeleton />
});

const SearchFilters = dynamic(() => import('@/components/SearchFilters'), {
  loading: () => <FiltersSkeleton />
});

// Lazy load pages
// Already using Next.js App Router - automatic code splitting per route
```

**2. Image Optimization:**
```typescript
// Use Next.js Image for all images
import Image from 'next/image';

// Configure image domains in next.config.mjs
images: {
  domains: ['your-r2-bucket.com'],
  formats: ['image/avif', 'image/webp'],
}
```

**3. API Response Optimization:**
```typescript
// Paginate large responses
// Already implemented - verify limits

// Add response compression
// next.config.mjs
compress: true,

// Cache API responses where appropriate
export async function GET(request: Request) {
  // ... fetch data

  return new Response(JSON.stringify(data), {
    headers: {
      'Cache-Control': 's-maxage=60, stale-while-revalidate=300'
    }
  });
}
```

**4. React Optimization:**
```typescript
// Memoize expensive computations
const filteredEntries = useMemo(() => {
  return entries.filter(/* complex filter logic */);
}, [entries, filters]);

// Memoize callbacks
const handleSubmit = useCallback((data) => {
  // ... submit logic
}, [dependencies]);

// Use React.memo for list items
const EntryCard = memo(function EntryCard({ entry }) {
  return (/* ... */);
});
```

**5. Database Query Optimization:**
```typescript
// Add indexes (already in schema)
@@index([createdAt(sort: Desc)])
@@index([ticker])
@@index([type])

// Select only needed fields
const entries = await prisma.entry.findMany({
  select: {
    id: true,
    content: true,
    createdAt: true,
    mood: true,
    // ... only needed fields
  },
  take: 20
});
```

**6. Bundle Analysis:**
```bash
# Add bundle analyzer
npm install @next/bundle-analyzer

# next.config.mjs
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
});

# Run analysis
ANALYZE=true npm run build
```

### Tasks

- [ ] **PERF-1**: Run Lighthouse audit and document baseline
- [ ] **PERF-2**: Implement dynamic imports for heavy components
- [ ] **PERF-3**: Add React.memo to list item components
- [ ] **PERF-4**: Optimize images with Next.js Image
- [ ] **PERF-5**: Add API response caching headers
- [ ] **PERF-6**: Run bundle analyzer and identify large dependencies
- [ ] **PERF-7**: Implement virtual scrolling for long entry lists
- [ ] **PERF-8**: Add skeleton loading states everywhere
- [ ] **PERF-9**: Re-run Lighthouse and verify improvements

---

## Feature 4: Inline Quick Edit

### Problem Statement
Users need to click into entry detail page to make small edits (fix typo, add a note). This friction discourages refinement.

### Solution
Inline editing directly from the journal list view for quick modifications.

### User Stories
1. As a user, I want to fix a typo without leaving the list view.
2. As a user, I want to add a quick note to a recent entry.
3. As a user, I want to change mood/conviction without full edit flow.

### Feature Specification

**Inline Edit Trigger:**
- Swipe left on entry card → Edit button (mobile)
- Click edit icon on hover (desktop)
- Long press on entry card (mobile alternative)

**Quick Edit Modal:**
```
┌─────────────────────────────────┐
│  Quick Edit           [Cancel]  │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────────┐│
│  │ [Editable content...]       ││
│  │                             ││
│  │                             ││
│  └─────────────────────────────┘│
│                                 │
│  Mood: [😊 Confident ▼]         │
│  Conviction: [● ● ○ Medium]     │
│                                 │
│  ┌─────────────────────────────┐│
│  │         Save Changes         ││
│  └─────────────────────────────┘│
│                                 │
│  [Full Edit →]  (link to page)  │
└─────────────────────────────────┘
```

**Implementation:**
```typescript
// components/InlineEditModal.tsx
interface InlineEditModalProps {
  entry: Entry;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Entry>) => void;
}

export function InlineEditModal({ entry, isOpen, onClose, onSave }: InlineEditModalProps) {
  const [content, setContent] = useState(entry.content);
  const [mood, setMood] = useState(entry.mood);
  const [conviction, setConviction] = useState(entry.conviction);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave({ content, mood, conviction });
    setIsSaving(false);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[70vh]">
        <SheetHeader>
          <SheetTitle>Quick Edit</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[150px]"
          />

          <div className="flex gap-4">
            <MoodSelector value={mood} onChange={setMood} />
            <ConvictionSelector value={conviction} onChange={setConviction} />
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>

          <Link href={`/journal/${entry.id}/edit`} className="text-sm text-muted-foreground">
            Full Edit →
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

**Swipe Gesture (Mobile):**
```typescript
// Using framer-motion for swipe
import { motion, useMotionValue, useTransform } from 'framer-motion';

function SwipeableEntryCard({ entry, onEdit, onDelete }) {
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-100, 0, 100],
    ['#ef4444', '#ffffff', '#3b82f6']
  );

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: -100, right: 100 }}
      style={{ x }}
      onDragEnd={(e, info) => {
        if (info.offset.x < -50) onDelete();
        if (info.offset.x > 50) onEdit();
      }}
    >
      <EntryCard entry={entry} />
    </motion.div>
  );
}
```

### Tasks

- [ ] **EDIT-1**: Create InlineEditModal component
- [ ] **EDIT-2**: Add edit icon to entry cards (desktop hover)
- [ ] **EDIT-3**: Implement swipe-to-edit gesture (mobile)
- [ ] **EDIT-4**: Add optimistic update for quick save
- [ ] **EDIT-5**: Re-run AI analysis if content changed significantly
- [ ] **EDIT-6**: Add edit history tracking (optional)

---

## Implementation Priority

### High Priority (Do First)
1. **PWA/Offline** - Critical for mobile usability
2. **Performance** - Impacts all users

### Medium Priority
3. **Guided Entry** - Improves new user experience

### Low Priority
4. **Inline Quick Edit** - Nice to have, not critical

---

## Success Metrics

| Feature | Metric | Target |
|---------|--------|--------|
| Guided Entry | Completion rate | > 80% |
| Guided Entry | New user retention | +20% vs freeform |
| PWA/Offline | Offline entries created | > 0 per week |
| PWA/Offline | Install rate | > 30% of mobile users |
| Performance | LCP | < 2.5s |
| Performance | Bundle size | < 200KB |
| Inline Edit | Usage rate | > 10% of edits |

---

## Dependencies

- **Dexie.js**: Already installed for IndexedDB
- **Framer Motion**: For swipe gestures (add if implementing inline edit)
- **next-pwa**: Already configured

---

## Estimated Effort

| Feature | Effort | Priority |
|---------|--------|----------|
| Guided Entry | 3-4 days | Medium |
| PWA/Offline | 2-3 days | High |
| Performance | 2-3 days | High |
| Inline Quick Edit | 2 days | Low |
| **Total** | **9-12 days** | |
