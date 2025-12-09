# PRD: Modern UX/UI Design System

## Overview

**Problem Statement:**
The current UI uses standard shadcn/ui defaults, which are functional but lack the polished, modern aesthetic of premium mobile apps. The design needs more depth, personality, and delight to match the quality of apps like Day One, Reflectly, and modern fintech applications.

**Solution:**
A comprehensive design system overhaul that implements modern mobile-first patterns including glassmorphism, soft shadows, micro-interactions, and a cohesive visual language optimized for mobile use.

**Design Inspiration:**
- Modern journaling apps (Day One, Reflectly, 5 Minute Journal)
- Fintech apps (Robinhood, Coinbase, Revolut)
- Note-taking apps (Notion, Bear, Craft)

---

## Design Reference Analysis

Based on the Sharpen and 5 Minute Journal app designs in `/design/`:

### Visual Style Summary

| Element | Pattern | Implementation |
|---------|---------|----------------|
| **Theme** | Dark-first with warm accents | Deep black (#0D0D0D), Amber accent (#F5A623) |
| **Cards** | Very rounded, subtle depth | 20-24px radius, soft shadows, glassmorphism overlays |
| **Navigation** | Bottom bar + center FAB | 5 items, FAB raised above bar with shadow |
| **Mood UI** | Large horizontal emoji picker | 5 emotions, 48px touch targets, pill selection |
| **Calendar** | Horizontal week strip | Current day = colored pill, abbreviated day names |
| **Entry Cards** | Rich preview cards | Title + text + timestamp, left color indicator |
| **Voice** | Waveform visualization | Inline audio waveform with play button |
| **Typography** | Warm, friendly | Large greetings, serif quotes, sans-serif UI |

### Specific CSS Values Extracted

```css
/* From design references */
:root {
  /* Dark theme (primary) */
  --bg-dark: #0D0D0D;
  --bg-card-dark: #1A1A1A;
  --bg-elevated-dark: #252525;

  /* Accent (amber/orange) */
  --accent-primary: #F5A623;
  --accent-hover: #E09A1F;
  --accent-light: #FFD980;

  /* Light theme */
  --bg-light: #FAF9F6;
  --bg-card-light: #FFFFFF;

  /* Border radius */
  --radius-card: 20px;
  --radius-button: 14px;
  --radius-pill: 24px;
  --radius-fab: 50%;

  /* Shadows */
  --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.08);
  --shadow-elevated: 0 8px 32px rgba(0, 0, 0, 0.12);
  --shadow-fab: 0 4px 16px rgba(245, 166, 35, 0.4);
}
```

---

## Design Principles

### 1. Mobile-First, Always
- Design for 390x844 (iPhone 14 Pro) first, then scale up
- Thumb-zone optimization for one-handed use
- Bottom navigation for primary actions
- Touch targets minimum 44x44px

### 2. Depth & Dimensionality
- Use layered surfaces with subtle shadows
- Glassmorphism for overlays and modals
- Soft shadows instead of hard borders
- Background gradients for visual interest

### 3. Motion & Delight
- Meaningful micro-interactions
- Smooth transitions (200-300ms)
- Haptic-like feedback on actions
- Celebrate achievements (streaks, milestones)

### 4. Clarity & Focus
- Progressive disclosure
- Clear visual hierarchy
- Generous whitespace
- Scannable content

---

## Color System

### Primary Palette

```css
:root {
  /* Brand Colors */
  --brand-primary: 222 47% 11%;      /* Deep navy #0f172a */
  --brand-accent: 217 91% 60%;       /* Vibrant blue #3b82f6 */
  --brand-accent-light: 213 94% 68%; /* Light blue #60a5fa */

  /* Semantic Colors */
  --success: 142 76% 36%;            /* Green #16a34a */
  --success-light: 142 69% 58%;      /* Light green #4ade80 */
  --warning: 38 92% 50%;             /* Amber #f59e0b */
  --warning-light: 45 93% 58%;       /* Light amber #fbbf24 */
  --danger: 0 84% 60%;               /* Red #ef4444 */
  --danger-light: 0 91% 71%;         /* Light red #f87171 */

  /* Mood Colors */
  --mood-confident: 142 76% 36%;     /* Green */
  --mood-excited: 38 92% 50%;        /* Amber */
  --mood-nervous: 0 84% 60%;         /* Red */
  --mood-uncertain: 262 83% 58%;     /* Purple */
  --mood-neutral: 220 9% 46%;        /* Gray */

  /* Entry Type Colors */
  --type-trade-idea: 217 91% 60%;    /* Blue */
  --type-trade: 142 76% 36%;         /* Green */
  --type-reflection: 262 83% 58%;    /* Purple */
  --type-observation: 25 95% 53%;    /* Orange */

  /* Surface Colors */
  --surface-0: 0 0% 100%;            /* White */
  --surface-1: 220 14% 96%;          /* Slight gray */
  --surface-2: 220 13% 91%;          /* Light gray */
  --surface-elevated: 0 0% 100%;     /* Cards */

  /* Gradient Backgrounds */
  --gradient-warm: linear-gradient(135deg, #fef3c7 0%, #fce7f3 50%, #ddd6fe 100%);
  --gradient-cool: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #ede9fe 100%);
  --gradient-success: linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%);
  --gradient-streak: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
}

.dark {
  --surface-0: 222 47% 11%;          /* Deep navy */
  --surface-1: 223 47% 14%;          /* Slightly lighter */
  --surface-2: 224 47% 18%;          /* Card surfaces */
  --surface-elevated: 225 47% 16%;   /* Elevated cards */

  --gradient-warm: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
  --gradient-cool: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}
```

### Glassmorphism Variables

```css
:root {
  /* Glass effects */
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(255, 255, 255, 0.2);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  --glass-blur: 12px;
}

.dark {
  --glass-bg: rgba(30, 41, 59, 0.8);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

---

## Typography

### Font Stack

```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
}
```

### Type Scale

| Name | Size | Weight | Line Height | Use Case |
|------|------|--------|-------------|----------|
| `text-xs` | 12px | 400 | 1.5 | Captions, timestamps |
| `text-sm` | 14px | 400 | 1.5 | Secondary text |
| `text-base` | 16px | 400 | 1.6 | Body text |
| `text-lg` | 18px | 500 | 1.5 | Card titles |
| `text-xl` | 20px | 600 | 1.4 | Section headers |
| `text-2xl` | 24px | 700 | 1.3 | Page titles |
| `text-3xl` | 30px | 700 | 1.2 | Hero text |
| `text-4xl` | 36px | 800 | 1.1 | Large metrics |

---

## Spacing System

### Base Unit: 4px

| Token | Value | Use Case |
|-------|-------|----------|
| `space-1` | 4px | Tight gaps |
| `space-2` | 8px | Icon gaps, inline spacing |
| `space-3` | 12px | Small component padding |
| `space-4` | 16px | Standard padding |
| `space-5` | 20px | Card padding |
| `space-6` | 24px | Section spacing |
| `space-8` | 32px | Large gaps |
| `space-10` | 40px | Page margins |
| `space-12` | 48px | Major sections |

### Container Widths

```css
.container-narrow { max-width: 480px; }   /* Mobile content */
.container-default { max-width: 640px; }  /* Standard content */
.container-wide { max-width: 768px; }     /* Wide content */
.container-full { max-width: 1024px; }    /* Dashboard */
```

---

## Component Specifications

### Cards (Modern Style)

```typescript
// components/ui/card-modern.tsx
const cardVariants = {
  default: `
    bg-white dark:bg-slate-800/50
    rounded-2xl
    border border-slate-200/50 dark:border-slate-700/50
    shadow-sm shadow-slate-200/50 dark:shadow-slate-900/50
    backdrop-blur-sm
  `,
  elevated: `
    bg-white dark:bg-slate-800/80
    rounded-2xl
    border-0
    shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50
    backdrop-blur-md
  `,
  glass: `
    bg-white/70 dark:bg-slate-800/70
    rounded-2xl
    border border-white/20 dark:border-slate-700/30
    shadow-lg shadow-slate-200/30 dark:shadow-slate-900/30
    backdrop-blur-xl
  `,
  gradient: `
    bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900
    rounded-2xl
    border border-slate-200/50 dark:border-slate-700/50
    shadow-md
  `,
  interactive: `
    bg-white dark:bg-slate-800/50
    rounded-2xl
    border border-slate-200/50 dark:border-slate-700/50
    shadow-sm
    transition-all duration-200
    hover:shadow-md hover:border-slate-300/50
    active:scale-[0.98]
  `
};
```

**CSS for Modern Cards:**

```css
.card-modern {
  @apply relative overflow-hidden;
  @apply bg-white dark:bg-slate-800/50;
  @apply rounded-2xl;
  @apply border border-slate-200/50 dark:border-slate-700/50;
  @apply shadow-sm;
  @apply transition-all duration-200;
}

.card-modern:hover {
  @apply shadow-md;
  transform: translateY(-1px);
}

.card-modern:active {
  transform: scale(0.98);
}

/* Glassmorphism Card */
.card-glass {
  @apply relative overflow-hidden;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  @apply rounded-2xl;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.dark .card-glass {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Buttons

```typescript
const buttonVariants = {
  // Primary - Main CTA
  primary: `
    bg-slate-900 dark:bg-white
    text-white dark:text-slate-900
    rounded-xl
    font-semibold
    shadow-md shadow-slate-900/20
    transition-all duration-200
    hover:shadow-lg hover:bg-slate-800
    active:scale-95
  `,

  // Secondary - Less emphasis
  secondary: `
    bg-slate-100 dark:bg-slate-800
    text-slate-900 dark:text-slate-100
    rounded-xl
    font-medium
    transition-all duration-200
    hover:bg-slate-200 dark:hover:bg-slate-700
    active:scale-95
  `,

  // Ghost - Minimal
  ghost: `
    bg-transparent
    text-slate-600 dark:text-slate-400
    rounded-xl
    font-medium
    transition-all duration-200
    hover:bg-slate-100 dark:hover:bg-slate-800
    active:scale-95
  `,

  // Accent - Colorful CTA
  accent: `
    bg-gradient-to-r from-blue-500 to-indigo-500
    text-white
    rounded-xl
    font-semibold
    shadow-md shadow-blue-500/30
    transition-all duration-200
    hover:shadow-lg hover:from-blue-600 hover:to-indigo-600
    active:scale-95
  `
};

const buttonSizes = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-base',
  lg: 'h-14 px-6 text-lg',
  icon: 'h-11 w-11',
  'icon-lg': 'h-14 w-14'
};
```

### Floating Action Button (FAB)

```typescript
// Modern FAB with gradient and shadow
const FloatingActionButton = () => (
  <button
    className={cn(
      // Base
      "fixed z-50",
      "h-14 w-14 rounded-full",
      "flex items-center justify-center",

      // Visual
      "bg-gradient-to-br from-blue-500 to-indigo-600",
      "text-white",
      "shadow-lg shadow-blue-500/40",

      // Position (thumb-reachable)
      "bottom-6 right-6",
      "md:bottom-8 md:right-8",

      // Interaction
      "transition-all duration-200",
      "hover:shadow-xl hover:scale-105",
      "active:scale-95",

      // Ripple effect
      "overflow-hidden relative"
    )}
  >
    <Plus className="h-6 w-6" />
  </button>
);
```

### Bottom Navigation with Center FAB (Reference Design Pattern)

Based on the Sharpen/5 Minute Journal designs - FAB is integrated INTO the bottom nav, raised above:

```typescript
// Bottom nav with integrated center FAB (matches reference designs)
const BottomNavigation = () => (
  <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
    {/* Backdrop blur container */}
    <div className="relative">
      {/* Center FAB - positioned above the bar */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-7">
        <button
          onClick={openQuickCapture}
          className={cn(
            "h-14 w-14 rounded-full",
            "bg-amber-500 hover:bg-amber-600",
            "text-white",
            "shadow-lg shadow-amber-500/40",
            "flex items-center justify-center",
            "transition-all duration-200",
            "active:scale-95"
          )}
        >
          <Plus className="h-7 w-7" />
        </button>
      </div>

      {/* Nav bar */}
      <div className={cn(
        "bg-white/90 dark:bg-[#0D0D0D]/90",
        "backdrop-blur-xl",
        "border-t border-slate-200/20 dark:border-white/5",
        "pb-safe" // Safe area for notched phones
      )}>
        <div className="flex items-center justify-around h-16 max-w-md mx-auto">
          <NavItem icon={Home} label="Home" href="/" />
          <NavItem icon={Calendar} label="Calendar" href="/calendar" />

          {/* Spacer for center FAB */}
          <div className="w-14" />

          <NavItem icon={BookOpen} label="Guides" href="/guides" />
          <NavItem icon={BarChart3} label="Insights" href="/insights" />
        </div>
      </div>
    </div>
  </nav>
);

const NavItem = ({ icon: Icon, label, href, isActive }) => (
  <Link
    href={href}
    className={cn(
      "flex flex-col items-center justify-center",
      "h-full px-3 min-w-[56px]",
      "transition-all duration-200",
      isActive
        ? "text-amber-500"
        : "text-slate-400 dark:text-slate-500"
    )}
  >
    <Icon className={cn(
      "h-6 w-6 mb-0.5",
      "transition-transform duration-200",
      isActive && "scale-110"
    )} />
    <span className="text-[10px] font-medium">{label}</span>
  </Link>
);
```

### Calendar Week Strip (Reference Design Pattern)

Horizontal scrollable week with today highlighted:

```typescript
const CalendarWeekStrip = ({ selectedDate, onSelectDate }) => {
  const weekDays = getWeekDays(selectedDate); // Returns Mon-Sun

  return (
    <div className="flex items-center justify-between px-4 py-3">
      {weekDays.map((day) => (
        <button
          key={day.date}
          onClick={() => onSelectDate(day.date)}
          className={cn(
            "flex flex-col items-center justify-center",
            "w-10 h-14 rounded-xl",
            "transition-all duration-200",
            day.isToday && "bg-amber-500 text-white shadow-lg shadow-amber-500/30",
            day.isSelected && !day.isToday && "bg-slate-100 dark:bg-slate-800",
            !day.isToday && !day.isSelected && "text-slate-500"
          )}
        >
          <span className="text-xs font-medium opacity-70">
            {day.dayName} {/* Mon, Tue, etc. */}
          </span>
          <span className={cn(
            "text-lg font-semibold mt-0.5",
            day.isToday && "text-white"
          )}>
            {day.dayNumber}
          </span>
        </button>
      ))}
    </div>
  );
};
```

### Bottom Sheet Modal

```typescript
// QuickCapture as bottom sheet
const BottomSheet = ({ isOpen, onClose, children }) => (
  <>
    {/* Backdrop */}
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm",
        "transition-opacity duration-300",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      onClick={onClose}
    />

    {/* Sheet */}
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-50",
        "bg-white dark:bg-slate-900",
        "rounded-t-3xl",
        "shadow-2xl",
        "transform transition-transform duration-300 ease-out",
        isOpen ? "translate-y-0" : "translate-y-full",
        "max-h-[90vh] overflow-hidden flex flex-col"
      )}
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-3 pb-2">
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
      </div>

      {children}
    </div>
  </>
);
```

### Mood Selector (Modern)

```typescript
const MoodSelector = ({ value, onChange }) => {
  const moods = [
    { value: 'CONFIDENT', emoji: '😊', label: 'Confident', color: 'bg-green-100 border-green-300' },
    { value: 'EXCITED', emoji: '🚀', label: 'Excited', color: 'bg-amber-100 border-amber-300' },
    { value: 'NEUTRAL', emoji: '😐', label: 'Neutral', color: 'bg-slate-100 border-slate-300' },
    { value: 'UNCERTAIN', emoji: '🤔', label: 'Uncertain', color: 'bg-purple-100 border-purple-300' },
    { value: 'NERVOUS', emoji: '😰', label: 'Nervous', color: 'bg-red-100 border-red-300' },
  ];

  return (
    <div className="flex gap-2 justify-center">
      {moods.map((mood) => (
        <button
          key={mood.value}
          onClick={() => onChange(mood.value)}
          className={cn(
            // Base
            "flex flex-col items-center justify-center",
            "w-16 h-20 rounded-2xl",
            "border-2 transition-all duration-200",

            // Selected state
            value === mood.value
              ? cn(mood.color, "scale-105 shadow-md")
              : "bg-white border-slate-200 hover:border-slate-300",

            // Interaction
            "active:scale-95"
          )}
        >
          <span className="text-2xl mb-1">{mood.emoji}</span>
          <span className="text-xs font-medium text-slate-600">{mood.label}</span>
        </button>
      ))}
    </div>
  );
};
```

### Streak Display (Celebratory)

```typescript
const StreakCard = ({ currentStreak, longestStreak }) => (
  <div
    className={cn(
      // Gradient background
      "bg-gradient-to-br from-amber-50 via-orange-50 to-red-50",
      "dark:from-amber-950/30 dark:via-orange-950/30 dark:to-red-950/30",

      // Card styling
      "rounded-2xl p-5",
      "border border-orange-200/50 dark:border-orange-800/30",

      // Shadow with color
      "shadow-lg shadow-orange-200/30 dark:shadow-orange-900/20"
    )}
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="text-4xl animate-pulse">🔥</div>
      <div>
        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
          Journaling Streak
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Keep the momentum going!
        </p>
      </div>
    </div>

    <div className="flex gap-6">
      <div>
        <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">
          {currentStreak}
        </p>
        <p className="text-sm text-slate-500">Current</p>
      </div>
      <div>
        <p className="text-4xl font-bold text-slate-400">
          {longestStreak}
        </p>
        <p className="text-sm text-slate-500">Best</p>
      </div>
    </div>

    {/* Progress towards next milestone */}
    {currentStreak > 0 && (
      <div className="mt-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{currentStreak} days</span>
          <span>{getNextMilestone(currentStreak)} days</span>
        </div>
        <div className="h-2 bg-orange-100 dark:bg-orange-900/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full transition-all duration-500"
            style={{ width: `${(currentStreak / getNextMilestone(currentStreak)) * 100}%` }}
          />
        </div>
      </div>
    )}
  </div>
);
```

### Entry Card (Timeline Style)

```typescript
const EntryCard = ({ entry }) => (
  <Link href={`/journal/${entry.id}`}>
    <div
      className={cn(
        // Base
        "group relative",
        "bg-white dark:bg-slate-800/50",
        "rounded-2xl p-4",
        "border border-slate-200/50 dark:border-slate-700/50",

        // Interaction
        "transition-all duration-200",
        "hover:shadow-md hover:border-slate-300/50",
        "active:scale-[0.98]"
      )}
    >
      {/* Type indicator line */}
      <div
        className={cn(
          "absolute left-0 top-4 bottom-4 w-1 rounded-full",
          entry.type === 'TRADE_IDEA' && "bg-blue-500",
          entry.type === 'TRADE' && "bg-green-500",
          entry.type === 'REFLECTION' && "bg-purple-500",
          entry.type === 'OBSERVATION' && "bg-orange-500"
        )}
      />

      <div className="pl-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={entry.type}>{formatType(entry.type)}</Badge>
            {entry.ticker && (
              <Badge variant="secondary" className="font-mono">
                {entry.ticker}
              </Badge>
            )}
          </div>
          {entry.mood && (
            <span className="text-xl">{moodEmoji[entry.mood]}</span>
          )}
        </div>

        {/* Content preview */}
        <p className="text-slate-700 dark:text-slate-300 line-clamp-2 mb-2">
          {entry.content}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {formatTimeAgo(entry.createdAt)}
          </span>
          {entry.thesisId && (
            <Badge variant="outline" className="text-xs">
              {entry.thesisName}
            </Badge>
          )}
        </div>
      </div>
    </div>
  </Link>
);
```

---

## Micro-Interactions

### Button Press

```css
.btn-interactive {
  transition: transform 150ms ease, box-shadow 150ms ease;
}

.btn-interactive:active {
  transform: scale(0.95);
}
```

### Card Hover

```css
.card-interactive {
  transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease;
}

.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
}

.card-interactive:active {
  transform: scale(0.98);
}
```

### Success Animation

```css
@keyframes success-pop {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

.animate-success {
  animation: success-pop 400ms ease-out;
}
```

### Streak Fire Animation

```css
@keyframes fire-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.animate-fire {
  animation: fire-pulse 1.5s ease-in-out infinite;
}
```

### Skeleton Loading

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    hsl(var(--muted)) 0%,
    hsl(var(--muted-foreground) / 0.1) 50%,
    hsl(var(--muted)) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}
```

---

## Page Layouts

### Dashboard Layout

```
┌─────────────────────────────────────────┐
│  [Glass Header - App Name + Settings]    │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────────┐│
│  │      🔥 Streak Card (Gradient)      ││
│  │         Current: 12 days            ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │      Weekly Snapshot (Glass)        ││
│  │    Stats • Mood • Quick Insight     ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │      Active Theses (Cards)          ││
│  │   [NVDA +$1.2k] [SPY -$300]        ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │      Recent Entries (Timeline)      ││
│  │   Entry 1 • Entry 2 • Entry 3       ││
│  └─────────────────────────────────────┘│
│                                         │
│            [Space for nav]              │
│                                         │
├─────────────────────────────────────────┤
│  [Home] [Journal] [Theses] [Insights]   │
│            Bottom Navigation            │
└─────────────────────────────────────────┘
        [FAB +]
```

### Entry Form Layout

```
┌─────────────────────────────────────────┐
│  ← Back           New Entry      [Save] │
├─────────────────────────────────────────┤
│                                         │
│  ── Mood (Large Touch Targets) ──       │
│  [😊] [🚀] [😐] [🤔] [😰]               │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │                                      ││
│  │     What's on your mind?            ││
│  │     (Auto-expanding textarea)        ││
│  │                                      ││
│  │                                      ││
│  └─────────────────────────────────────┘│
│                                         │
│  [🎤 Voice] [📷 Photo] [📎 Attach]      │
│                                         │
│  ── Link to Thesis ──                   │
│  [Select or create thesis... ▼]         │
│                                         │
│  ── Optional Details ──                 │
│  Type: [Auto-detected ▼]                │
│  Ticker: [NVDA_____]                    │
│  Conviction: [●●●○○]                    │
│                                         │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │           Save Entry                ││
│  │       (Full-width button)           ││
│  └─────────────────────────────────────┘│
│                                         │
└─────────────────────────────────────────┘
```

---

## Implementation Tasks

### Phase 1: Foundation (Week 1)
- [ ] Update globals.css with new color system
- [ ] Add CSS custom properties for glassmorphism
- [ ] Update tailwind.config.js with new tokens
- [ ] Create modern card variants component
- [ ] Update button component with new variants

### Phase 2: Navigation (Week 1-2)
- [ ] Create BottomNavigation component
- [ ] Update layout to use bottom nav on mobile
- [ ] Keep top nav for desktop only
- [ ] Add safe area padding for notched phones
- [ ] Implement nav item active states

### Phase 3: Core Components (Week 2)
- [ ] Redesign FAB with gradient and shadow
- [ ] Update QuickCapture as bottom sheet
- [ ] Redesign mood selector (large touch targets)
- [ ] Create new entry card design
- [ ] Update streak card with gradient

### Phase 4: Dashboard Redesign (Week 3)
- [ ] Implement new dashboard layout
- [ ] Add glass header
- [ ] Create thesis summary cards
- [ ] Update weekly snapshot design
- [ ] Add micro-interactions

### Phase 5: Forms & Inputs (Week 3-4)
- [ ] Redesign entry form layout
- [ ] Update input styling
- [ ] Add conviction slider
- [ ] Implement thesis selector
- [ ] Add attachment previews

### Phase 6: Polish (Week 4)
- [ ] Add all micro-interactions
- [ ] Implement skeleton loaders
- [ ] Add success animations
- [ ] Test on various devices
- [ ] Performance optimization

---

## Accessibility Requirements

### Touch Targets
- Minimum 44x44px for all interactive elements
- 48x48px recommended for primary actions
- Adequate spacing between targets (8px minimum)

### Color Contrast
- WCAG 2.1 AA compliance (4.5:1 for text)
- Don't rely on color alone for meaning
- Use icons + color + text for states

### Motion
- Respect `prefers-reduced-motion`
- Provide alternatives to animations
- Keep animations under 300ms

### Screen Readers
- Proper heading hierarchy
- Meaningful alt text
- ARIA labels on icon buttons
- Focus management in modals

---

## Success Metrics

**Visual Quality:**
- [ ] Consistent border-radius (2xl = 16px)
- [ ] Consistent spacing (4px grid)
- [ ] Glassmorphism effects render properly
- [ ] Gradients look smooth

**Performance:**
- [ ] LCP < 2.5s
- [ ] No layout shift
- [ ] 60fps animations
- [ ] No jank on scroll

**Usability:**
- [ ] All touch targets ≥ 44px
- [ ] Bottom nav reachable with thumb
- [ ] Forms completable one-handed
- [ ] Clear visual feedback on all actions
