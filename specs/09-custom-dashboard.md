# PRD: Custom Dashboard Builder

## Overview

**Problem Statement:**
Traders have different priorities and workflows. A fixed dashboard layout may surface irrelevant information while hiding what matters most to each individual user.

**Solution:**
A drag-and-drop dashboard builder that allows traders to select, arrange, and configure widgets based on their personal workflow and priorities.

**Success Metrics:**
- 40%+ of users customize their dashboard
- Increased daily engagement (measured by session duration)
- Reduced time-to-action for common tasks
- User satisfaction score > 4/5 for dashboard

---

## Design Philosophy

### Progressive Complexity
1. **Default Dashboard**: Works great out-of-the-box for new users
2. **Simple Customization**: Drag to reorder, toggle widgets on/off
3. **Advanced Configuration**: Widget-specific settings, layouts

### Mobile-First Grid
- 1 column on mobile (stacked widgets)
- 2 columns on tablet
- 3-4 columns on desktop
- Widgets flow responsively

---

## User Stories

### Basic Customization
1. As a trader, I want to hide widgets I don't use so my dashboard is cleaner.
2. As a trader, I want to reorder widgets so the most important ones are at the top.
3. As a trader, I want to reset to the default layout if I don't like my changes.

### Widget Configuration
4. As a trader, I want to configure which tickers appear in my watchlist widget.
5. As a trader, I want to choose the timeframe for my stats (7 days, 30 days, etc.).
6. As a trader, I want to expand some widgets to full-width for more detail.

### Saved Layouts
7. As a trader, I want to save multiple dashboard layouts for different contexts.
8. As a trader, I want to quickly switch between "morning review" and "end of day" layouts.
9. As a trader, I want to share my layout configuration with other users.

---

## Widget Library

### Core Widgets

| Widget | Description | Size Options |
|--------|-------------|--------------|
| **Quick Capture** | Fast entry creation | Small, Medium |
| **Journaling Streak** | Current streak + calendar | Small, Medium |
| **Weekly Insights** | AI-generated summary | Medium, Large |
| **Recent Entries** | Latest journal entries | Medium, Large |
| **Mood Trend** | Emotional pattern chart | Small, Medium |
| **Bias Tracker** | Top biases this period | Small, Medium |
| **Conviction Analysis** | Conviction vs. outcomes | Medium |
| **Open Positions** | Current options positions | Medium, Large |
| **Coach Prompt** | AI coach suggestions | Small |
| **Goals Progress** | Active goal tracking | Small, Medium |
| **Accountability** | Partner comparison | Small |
| **Market Conditions** | VIX, SPY status | Small |
| **Tag Cloud** | Frequently used tags | Small |
| **Calendar Heatmap** | Journal activity calendar | Medium |

### Widget Specifications

```typescript
interface Widget {
  id: string;
  type: WidgetType;
  name: string;
  description: string;

  // Size constraints
  sizes: WidgetSize[];
  defaultSize: WidgetSize;

  // Configuration options
  configSchema: WidgetConfigSchema;
  defaultConfig: WidgetConfig;

  // Requirements
  requiredFeatures?: string[];  // e.g., ['positions'] for Open Positions widget
  minDataDays?: number;         // Minimum days of data needed

  // Metadata
  category: WidgetCategory;
  isCore: boolean;              // Core vs. optional
}

type WidgetSize = 'small' | 'medium' | 'large' | 'full';
type WidgetCategory = 'capture' | 'insights' | 'tracking' | 'positions' | 'social';
```

### Widget Configuration Examples

**Recent Entries Widget:**
```typescript
interface RecentEntriesConfig {
  count: number;           // 3, 5, or 10
  showTicker: boolean;
  showMood: boolean;
  showConviction: boolean;
  filterByType?: EntryType[];
  filterByTicker?: string[];
}
```

**Weekly Insights Widget:**
```typescript
interface WeeklyInsightsConfig {
  showStatistics: boolean;
  showEmotionalTrends: boolean;
  showBiasPatterns: boolean;
  showAIInsights: boolean;
  compactMode: boolean;
}
```

**Mood Trend Widget:**
```typescript
interface MoodTrendConfig {
  timeframe: 7 | 14 | 30 | 90;
  chartType: 'line' | 'bar' | 'heatmap';
  showAverage: boolean;
}
```

---

## Grid System

### Layout Model

```typescript
interface DashboardLayout {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;

  // Grid configuration
  widgets: WidgetPlacement[];

  // Responsive breakpoints
  breakpoints: {
    mobile: number;    // 640
    tablet: number;    // 1024
    desktop: number;   // 1280
  };

  createdAt: Date;
  updatedAt: Date;
}

interface WidgetPlacement {
  widgetId: string;
  widgetType: WidgetType;
  config: WidgetConfig;

  // Grid position (12-column grid)
  position: {
    mobile: GridPosition;
    tablet: GridPosition;
    desktop: GridPosition;
  };
}

interface GridPosition {
  x: number;      // Column start (0-11)
  y: number;      // Row number
  w: number;      // Width in columns
  h: number;      // Height in rows
}
```

### Size to Grid Mapping

| Size | Mobile (1 col) | Tablet (2 col) | Desktop (3 col) |
|------|----------------|----------------|-----------------|
| Small | 12 × 2 | 6 × 2 | 4 × 2 |
| Medium | 12 × 3 | 6 × 3 | 4 × 3 |
| Large | 12 × 4 | 12 × 3 | 8 × 4 |
| Full | 12 × 4 | 12 × 3 | 12 × 4 |

---

## UI Specifications

### Dashboard View (Normal Mode)

```
┌─────────────────────────────────────────┐
│  Dashboard                    [⚙️ Edit]  │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 🔥 5-Day Streak         [Quick +]  ││
│  │ Keep it going!                      ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 📊 Weekly Insights                  ││
│  │ 12 entries • Mood: Improving        ││
│  │ Top bias: Confirmation (3x)         ││
│  │ ...                                 ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌────────────────┐ ┌──────────────────┐│
│  │ 😊 Mood Trend  │ │ 🎯 Goals         ││
│  │ [Chart]       │ │ • Reduce FOMO    ││
│  │               │ │   ████░░ 60%     ││
│  └────────────────┘ └──────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 📝 Recent Entries                   ││
│  │ • Dec 5: NVDA thesis...            ││
│  │ • Dec 4: Market reflection...      ││
│  │ • Dec 3: SPY puts review...        ││
│  └─────────────────────────────────────┘│
│                                         │
└─────────────────────────────────────────┘
```

### Edit Mode

```
┌─────────────────────────────────────────┐
│  Edit Dashboard            [Done] [↩️]   │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ ≡ 🔥 Streak              [⚙️] [×]  ││
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ││
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ ≡ 📊 Weekly Insights     [⚙️] [×]  ││
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ││
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ││
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ││
│  └─────────────────────────────────────┘│
│           ↕️ Drag to reorder            │
│                                         │
│  ── Add Widgets ──                      │
│  [+ Mood Trend]  [+ Open Positions]     │
│  [+ Goals]       [+ Tag Cloud]          │
│                                         │
└─────────────────────────────────────────┘
```

### Widget Configuration Modal

```
┌─────────────────────────────────────────┐
│  Configure: Recent Entries       [×]    │
├─────────────────────────────────────────┤
│                                         │
│  Size: [Small ▼]                        │
│                                         │
│  ── Display Options ──                  │
│                                         │
│  Number of entries: [5 ▼]               │
│                                         │
│  [✓] Show ticker symbol                 │
│  [✓] Show mood indicator                │
│  [ ] Show conviction level              │
│  [✓] Show entry type badge              │
│                                         │
│  ── Filters ──                          │
│                                         │
│  Entry types: [All ▼]                   │
│  Tickers: [All ▼]                       │
│                                         │
│  [Save]  [Cancel]                       │
│                                         │
└─────────────────────────────────────────┘
```

### Layout Switcher

```
┌─────────────────────────────────────────┐
│  Layouts                         [+]    │
├─────────────────────────────────────────┤
│                                         │
│  ● Default Layout                       │
│    Standard dashboard                   │
│                                         │
│  ○ Morning Review                       │
│    Market conditions + open positions   │
│                                         │
│  ○ End of Day                          │
│    Recent entries + weekly insights     │
│                                         │
│  ○ Minimal                             │
│    Just streak + quick capture          │
│                                         │
│  [Apply] [Edit] [Delete]                │
│                                         │
└─────────────────────────────────────────┘
```

---

## Database Schema

```prisma
model DashboardLayout {
  id          String    @id @default(cuid())
  userId      String

  name        String
  description String?
  isDefault   Boolean   @default(false)
  isActive    Boolean   @default(false)  // Currently selected

  // Grid configuration stored as JSON
  widgets     Json      // WidgetPlacement[]

  // Sharing
  isPublic    Boolean   @default(false)
  shareSlug   String?   @unique

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId])
  @@index([userId, isActive])
}

model WidgetConfig {
  id          String    @id @default(cuid())
  userId      String

  widgetType  String
  config      Json      // Widget-specific configuration

  // For shared/default configs
  isDefault   Boolean   @default(false)

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([userId, widgetType])
  @@index([userId])
}

// Pre-built layout templates
model LayoutTemplate {
  id          String    @id @default(cuid())

  name        String
  description String
  category    String    // 'beginner', 'advanced', 'minimal'

  widgets     Json      // Default widget configuration
  thumbnail   String?   // Preview image URL

  usageCount  Int       @default(0)
  isActive    Boolean   @default(true)

  createdAt   DateTime  @default(now())
}
```

---

## API Endpoints

### Layouts

```typescript
// Get user's layouts
GET /api/dashboard/layouts
Response: {
  layouts: DashboardLayout[];
  active: string;  // Active layout ID
}

// Create new layout
POST /api/dashboard/layouts
{
  name: string;
  description?: string;
  widgets: WidgetPlacement[];
  copyFrom?: string;  // Copy from existing layout
}

// Update layout
PUT /api/dashboard/layouts/:id
{
  name?: string;
  widgets?: WidgetPlacement[];
}

// Delete layout
DELETE /api/dashboard/layouts/:id

// Set active layout
POST /api/dashboard/layouts/:id/activate

// Clone layout
POST /api/dashboard/layouts/:id/clone
```

### Widget Configuration

```typescript
// Get widget data
GET /api/dashboard/widgets/:type
Query: { config: WidgetConfig }
Response: {
  data: WidgetData;
  lastUpdated: string;
}

// Save widget config
PUT /api/dashboard/widgets/:type/config
{
  config: WidgetConfig;
}

// Get available widgets
GET /api/dashboard/widgets/available
Response: {
  widgets: WidgetDefinition[];
  categories: string[];
}
```

### Templates

```typescript
// Get layout templates
GET /api/dashboard/templates
Response: {
  templates: LayoutTemplate[];
}

// Apply template
POST /api/dashboard/templates/:id/apply
Response: {
  layout: DashboardLayout;
}
```

---

## Widget Components

### Base Widget Component

```typescript
// components/dashboard/Widget.tsx
interface WidgetProps {
  id: string;
  type: WidgetType;
  config: WidgetConfig;
  size: WidgetSize;
  isEditing: boolean;
  onConfigChange: (config: WidgetConfig) => void;
  onRemove: () => void;
}

export function Widget({ id, type, config, size, isEditing, onConfigChange, onRemove }: WidgetProps) {
  const WidgetComponent = WIDGET_COMPONENTS[type];

  if (isEditing) {
    return (
      <div className="widget-wrapper editing">
        <div className="widget-header">
          <DragHandle />
          <span>{WIDGET_META[type].name}</span>
          <button onClick={() => openConfig(type, config)}>⚙️</button>
          <button onClick={onRemove}>×</button>
        </div>
        <div className="widget-placeholder" />
      </div>
    );
  }

  return (
    <div className={cn('widget-wrapper', `size-${size}`)}>
      <WidgetComponent config={config} />
    </div>
  );
}
```

### Example: Mood Trend Widget

```typescript
// components/dashboard/widgets/MoodTrendWidget.tsx
interface MoodTrendWidgetProps {
  config: MoodTrendConfig;
}

export function MoodTrendWidget({ config }: MoodTrendWidgetProps) {
  const { data, isLoading } = useMoodTrend(config.timeframe);

  if (isLoading) return <WidgetSkeleton />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Mood Trend ({config.timeframe} days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {config.chartType === 'line' && (
          <MoodLineChart data={data} showAverage={config.showAverage} />
        )}
        {config.chartType === 'heatmap' && (
          <MoodHeatmap data={data} />
        )}
      </CardContent>
    </Card>
  );
}
```

### Dashboard Grid

```typescript
// components/dashboard/DashboardGrid.tsx
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';

interface DashboardGridProps {
  layout: DashboardLayout;
  isEditing: boolean;
  onLayoutChange: (widgets: WidgetPlacement[]) => void;
}

export function DashboardGrid({ layout, isEditing, onLayoutChange }: DashboardGridProps) {
  const [widgets, setWidgets] = useState(layout.widgets);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex(w => w.widgetId === active.id);
      const newIndex = widgets.findIndex(w => w.widgetId === over.id);

      const newWidgets = arrayMove(widgets, oldIndex, newIndex);
      setWidgets(newWidgets);
      onLayoutChange(newWidgets);
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={widgets.map(w => w.widgetId)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-12 gap-4">
          {widgets.map(widget => (
            <SortableWidget
              key={widget.widgetId}
              widget={widget}
              isEditing={isEditing}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

---

## Default Layouts

### Default Layout (New Users)

```typescript
const DEFAULT_LAYOUT: WidgetPlacement[] = [
  {
    widgetId: 'quick-capture',
    widgetType: 'QUICK_CAPTURE',
    config: {},
    position: { desktop: { x: 0, y: 0, w: 4, h: 2 } }
  },
  {
    widgetId: 'streak',
    widgetType: 'STREAK',
    config: {},
    position: { desktop: { x: 4, y: 0, w: 4, h: 2 } }
  },
  {
    widgetId: 'coach-prompt',
    widgetType: 'COACH_PROMPT',
    config: {},
    position: { desktop: { x: 8, y: 0, w: 4, h: 2 } }
  },
  {
    widgetId: 'weekly-insights',
    widgetType: 'WEEKLY_INSIGHTS',
    config: { compactMode: false },
    position: { desktop: { x: 0, y: 2, w: 8, h: 4 } }
  },
  {
    widgetId: 'goals',
    widgetType: 'GOALS_PROGRESS',
    config: {},
    position: { desktop: { x: 8, y: 2, w: 4, h: 4 } }
  },
  {
    widgetId: 'recent-entries',
    widgetType: 'RECENT_ENTRIES',
    config: { count: 5 },
    position: { desktop: { x: 0, y: 6, w: 12, h: 4 } }
  }
];
```

### Template: Options Trader

```typescript
const OPTIONS_TRADER_LAYOUT: WidgetPlacement[] = [
  { widgetType: 'MARKET_CONDITIONS', ... },
  { widgetType: 'OPEN_POSITIONS', ... },
  { widgetType: 'QUICK_CAPTURE', ... },
  { widgetType: 'RECENT_ENTRIES', config: { filterByType: ['TRADE', 'TRADE_IDEA'] } },
  { widgetType: 'CONVICTION_ANALYSIS', ... },
];
```

### Template: Psychology Focus

```typescript
const PSYCHOLOGY_FOCUS_LAYOUT: WidgetPlacement[] = [
  { widgetType: 'STREAK', ... },
  { widgetType: 'MOOD_TREND', ... },
  { widgetType: 'BIAS_TRACKER', ... },
  { widgetType: 'COACH_PROMPT', ... },
  { widgetType: 'GOALS_PROGRESS', ... },
  { widgetType: 'WEEKLY_INSIGHTS', config: { showStatistics: false, showEmotionalTrends: true } },
];
```

---

## Implementation Phases

### Phase 1: Core Grid System (Week 1-2)
- [ ] Install @dnd-kit for drag-and-drop
- [ ] Create DashboardGrid component
- [ ] Implement responsive grid layout
- [ ] Build basic widget wrapper
- [ ] Create layout persistence (database)

### Phase 2: Widget Library (Week 2-3)
- [ ] Refactor existing dashboard components into widgets
- [ ] Create widget configuration schemas
- [ ] Build widget config modal
- [ ] Implement widget data fetching hooks
- [ ] Add widget loading states

### Phase 3: Edit Mode (Week 3-4)
- [ ] Create edit mode toggle
- [ ] Implement drag-and-drop reordering
- [ ] Build "Add Widget" panel
- [ ] Add remove widget functionality
- [ ] Create reset to default option

### Phase 4: Layouts & Templates (Week 4-5)
- [ ] Implement multiple layouts per user
- [ ] Create layout switcher UI
- [ ] Build template gallery
- [ ] Add layout sharing (optional)
- [ ] Create "copy layout" feature

### Phase 5: Polish (Week 5-6)
- [ ] Add smooth animations
- [ ] Optimize performance (virtualization)
- [ ] Mobile drag-and-drop support
- [ ] Keyboard navigation
- [ ] Accessibility audit

---

## Technical Considerations

### Performance

```typescript
// Lazy load widget components
const WIDGET_COMPONENTS = {
  STREAK: dynamic(() => import('./widgets/StreakWidget')),
  WEEKLY_INSIGHTS: dynamic(() => import('./widgets/WeeklyInsightsWidget')),
  // ...
};

// Memoize widget data
const useMemoizedWidgetData = (type: WidgetType, config: WidgetConfig) => {
  return useSWR(
    ['/api/dashboard/widgets', type, JSON.stringify(config)],
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );
};
```

### Mobile Considerations

```typescript
// Touch-friendly drag handles
const DragHandle = () => (
  <div className="touch-target p-3 cursor-grab active:cursor-grabbing">
    <GripVertical className="h-5 w-5 text-muted-foreground" />
  </div>
);

// Simplified mobile edit mode
const MobileEditMode = ({ widgets, onReorder }) => (
  <div className="space-y-2">
    {widgets.map((widget, index) => (
      <div key={widget.id} className="flex items-center gap-2">
        <button onClick={() => moveUp(index)}>↑</button>
        <span>{widget.name}</span>
        <button onClick={() => moveDown(index)}>↓</button>
        <button onClick={() => remove(index)}>×</button>
      </div>
    ))}
  </div>
);
```

---

## Cost Estimates

| Component | Cost |
|-----------|------|
| @dnd-kit | $0 (open source) |
| Additional storage | Negligible |
| **Total** | **$0/month** |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Complex state management | Medium | Use SWR/React Query; local state for editing |
| Performance with many widgets | Medium | Virtualization; lazy loading; memoization |
| Mobile drag-and-drop issues | Medium | Fallback to button-based reorder on mobile |
| Layout migration issues | Low | Version layouts; provide migration scripts |

---

## Success Criteria

**MVP (Launch):**
- [ ] Drag-and-drop reordering works
- [ ] Widget visibility toggle
- [ ] Basic widget configuration
- [ ] Layout persistence
- [ ] Reset to default

**Post-MVP (30 days):**
- [ ] 30%+ users customize dashboard
- [ ] Multiple saved layouts used by 10%
- [ ] Average session duration increases 20%
- [ ] No performance degradation (LCP < 2.5s)
