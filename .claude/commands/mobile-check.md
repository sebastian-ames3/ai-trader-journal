---
description: Quick mobile UI validation (iPhone 14 Pro viewport)
---

You are performing a **mobile-first design validation** for the AI Trader Journal app.

## Target Viewport
- **iPhone 14 Pro**: 390x844px (primary mobile target)

## Task

1. **Ask user which page to test** (if not already specified)
   - Example: `/journal/new`, `/journal`, `/insights`

2. **Launch Playwright and navigate**:
   ```typescript
   browser_navigate to http://localhost:3000/[target-page]
   browser_resize to width=390 height=844
   browser_take_screenshot with fullPage=true
   ```

3. **Capture console logs**:
   ```typescript
   browser_console_messages
   ```

4. **Validate against mobile checklist** (from CLAUDE.md):
   - [ ] No horizontal scroll
   - [ ] Touch targets ≥44x44px
   - [ ] Fixed submit button at bottom (56px height)
   - [ ] Back button top-left (44x44px)
   - [ ] No overlapping elements
   - [ ] Text wraps properly
   - [ ] Zero console errors

5. **Report findings**:
   - Show screenshot
   - List PASS/FAIL for each checklist item
   - Note any console errors
   - Provide quick-win fixes (1-2 highest priority issues)

## Output Format

```
📱 Mobile Check Results (390x844)

Screenshot: [attach screenshot]

✅ PASSES:
- Touch targets meet 44px minimum
- No horizontal scroll

❌ FAILURES:
- Submit button only 40px height (need 56px)
- Textarea only 100px min-height (need 120px)

🔴 Console Errors:
- None

🔧 Quick Fixes:
1. Change h-10 to h-14 on submit button (line 330)
2. Update min-h-[200px] to min-h-[120px] on textarea (line 216)

Grade: B+ (would be A with fixes)
```

Be concise, visual, and actionable. This is a quick check, not a full audit.
