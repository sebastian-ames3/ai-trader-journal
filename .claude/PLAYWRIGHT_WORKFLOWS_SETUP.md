# Playwright Design Workflows - Setup Complete! 🎨

## What Was Built

You now have **automated UI testing and design validation** powered by Playwright MCP. This system helps you build incredible mobile-first UIs with confidence.

### Files Created

1. **Design System Documentation** (`CLAUDE.md`)
   - Complete style token reference (colors, typography, spacing)
   - UI Acceptance Checklist (Visual, Layout, A11y, Performance)
   - Component inventory
   - Default viewports (iPhone 14 Pro, iPad, Desktop)

2. **Design Review Agent** (`.claude/agents/design-review.md`)
   - Comprehensive multi-viewport testing
   - Automated screenshot capture
   - Console log analysis
   - Structured issue reporting with severity ranking
   - Optional auto-fix capability

3. **Slash Commands** (`.claude/commands/`)
   - `/mobile-check` - Quick mobile validation (30s)
   - `/fix-console` - Auto-detect/fix console errors
   - `/accessibility` - WCAG 2.1 AA compliance audit

---

## Quick Start (Test It Now!)

### Step 1: Start Dev Server (Windows PowerShell)

```powershell
cd "C:\Users\14102\Documents\Sebastian Ames\Projects\ai-trader-journal"
npm run dev
```

Wait for: `Ready on http://localhost:3000`

### Step 2: Run Your First Mobile Check

In Claude Code chat (separate conversation or continue this one):

```
/mobile-check
```

When prompted, specify target page:
```
/journal/new
```

### What You'll Get

```
📱 Mobile Check Results (390x844)

[Screenshot attached]

✅ PASSES:
- Touch targets meet 44px minimum
- No horizontal scroll
- Fixed submit button at bottom
- Back button properly positioned

❌ FAILURES:
- None detected!

🔴 Console Errors:
- None

Grade: A
```

---

## Workflow Examples

### 1. After Making UI Changes

```
# Quick validation loop
/mobile-check
# Fix any issues
/mobile-check  # Re-validate
```

### 2. Before Committing

```
# Comprehensive review
@agent design-review --target=/journal/new

# Auto-fix high-priority issues
@agent design-review --target=/journal/new --apply-fixes=true --severity=high
```

### 3. Before Pull Request

```
# Multi-viewport comparison
@agent design-review --target=/journal --viewports=mobile,tablet,desktop

# Accessibility audit
/accessibility
```

### 4. Debugging Console Errors

```
/fix-console
# Will auto-fix safe issues, report others
```

---

## How The Iterative Loop Works

This is the **core workflow** from the YouTube video you shared:

```
1. Make UI change (e.g., adjust button size)
   ↓
2. /mobile-check (captures screenshot, validates)
   ↓
3. Review structured report
   ↓
4. Apply suggested fixes
   ↓
5. /mobile-check (re-validate)
   ↓
6. Repeat until Grade A
```

**Key Insight:** Playwright lets Claude **see** your UI and compare it to the design system. This creates a feedback loop where design quality improves automatically.

---

## Real Example: Validating /journal/new

Let's validate the new entry form page:

### Command
```
@agent design-review --target=/journal/new
```

### What The Agent Does

1. **Navigate**: Opens http://localhost:3000/journal/new
2. **Resize**: Tests at 390x844 (iPhone 14 Pro)
3. **Screenshot**: Captures full page
4. **Console Check**: Monitors for JavaScript errors
5. **Interact**: Fills form fields, clicks buttons
6. **Validate**: Compares against acceptance checklist
7. **Report**: Generates structured findings

### Expected Report Structure

```json
{
  "summary": "Mobile: A- | Desktop: B+ — Minor touch target issues",
  "issues": [
    {
      "id": "I1",
      "severity": "medium",
      "category": "Layout & Responsiveness",
      "description": "Entry type buttons may be too small on small devices",
      "file": "src/app/journal/new/page.tsx",
      "line": 193,
      "suggested_fix": "Add min-h-[44px] to ensure touch target"
    }
  ],
  "console_errors": [],
  "recommended_actions": [
    "Add touch target minimum to entry type buttons"
  ]
}
```

---

## Testing Strategy

### During Development
- **Run `/mobile-check` after every UI change**
- Goal: Catch issues immediately (< 30 seconds)
- Fix before moving forward

### Before Committing
- **Run `@agent design-review`** on changed pages
- Fix all HIGH severity issues
- Address MEDIUM issues if quick

### Before Pull Request
- **Run `/accessibility`** on all pages
- Ensure WCAG AA compliance
- Take screenshots for PR description

### Before Release
- **Multi-viewport validation**
- All pages Grade A on mobile
- Zero console errors
- Full accessibility compliance

---

## Benefits You'll See

### 1. Faster Development
- Catch issues in 30 seconds vs. manual testing
- Auto-fix common problems
- No more "looks fine on my screen" bugs

### 2. Better Quality
- Consistent design system adherence
- Mobile-first by default
- Accessibility built-in

### 3. Confidence
- Objective validation (not subjective "looks good")
- Visual evidence (screenshots)
- Reproducible results

### 4. Learning
- Understand why fixes matter
- Improve design skills
- Build muscle memory for good patterns

---

## Next Steps

### Option 1: Test Current UI (Recommended)
1. Start dev server (PowerShell)
2. Run `/mobile-check` on `/journal/new`
3. Review findings
4. Apply any suggested fixes
5. Re-validate

### Option 2: Design Review Loop
1. Start dev server
2. Run `@agent design-review --target=/journal`
3. Review comprehensive report
4. Apply fixes with agent's help
5. Re-run validation
6. Iterate until Grade A

### Option 3: Accessibility Audit
1. Start dev server
2. Run `/accessibility` on `/journal/new`
3. Review WCAG compliance report
4. Fix contrast/label issues
5. Achieve AA compliance

---

## Troubleshooting

### "Agent not found"
- Restart Claude Code to load new agents
- Check `.claude/agents/design-review.md` exists

### "Cannot connect to localhost:3000"
- Ensure dev server running (PowerShell: `npm run dev`)
- Verify no firewall blocking port 3000

### "Playwright errors"
- First time: May need `npx playwright install`
- Windows: Run from PowerShell, not WSL

### "Screenshots not appearing"
- Check Playwright MCP is enabled in `.mcp.json`
- Restart Claude Code

---

## Documentation

All workflows documented in:
- **CLAUDE.md** - Design System & Playwright Workflows section
- **`.claude/agents/design-review.md`** - Agent specification
- **`.claude/commands/*.md`** - Slash command definitions

---

## Philosophy

> "The best UI is built through iteration, not perfection on first try."

This system embraces **rapid feedback loops**:
- See the problem (screenshot)
- Understand the fix (structured report)
- Apply the change (suggested code)
- Validate immediately (re-run check)

Over time, you'll internalize the design system and need fewer iterations. But the safety net is always there.

---

## Ready to Test?

**Start here:**

1. Open Windows PowerShell
2. `npm run dev`
3. Switch to Claude Code
4. Type: `/mobile-check`
5. Enter target: `/journal/new`
6. Review the magic ✨

Enjoy building incredible UIs! 🚀
