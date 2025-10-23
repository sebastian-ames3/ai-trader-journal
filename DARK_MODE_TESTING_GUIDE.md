# Dark Mode Testing Guide

## 🎯 Quick Testing Checklist

Since Playwright MCP isn't available in this session, please manually test using these steps:

### 1. Theme Toggle Functionality

**Test Steps:**
1. Open http://localhost:3000
2. Look for moon icon (🌙) in top-right navigation
3. Click the moon icon
4. Verify:
   - ✅ Icon changes to sun (☀️)
   - ✅ Background changes from white to dark gray
   - ✅ All text remains readable
   - ✅ No flash/flicker during transition

**Expected Behavior:**
- Light mode: White backgrounds, dark text, moon icon
- Dark mode: Dark gray backgrounds, light text, sun icon
- Toggle should work instantly with smooth transition

### 2. Dashboard Page (/) - Light & Dark

**Test in Light Mode:**
- ✅ White page background
- ✅ White card backgrounds with subtle shadows
- ✅ Black/dark gray text is readable
- ✅ Streak badge (orange) is visible
- ✅ Badge colors are vibrant but not harsh

**Test in Dark Mode:**
- ✅ Dark gray page background (#0A0A0A area)
- ✅ Slightly lighter card backgrounds (#1F1F1F area)
- ✅ White/light gray text is readable
- ✅ Streak badge has darker background, lighter text
- ✅ All badges have dark variants (green-950, blue-950, etc.)

**Specific Elements to Check:**
- Weekly Snapshot card title and stats
- Sentiment badge (should be green/red/gray with dark variants)
- Streak card with fire emoji
- Recent entries section
- "Keep the momentum going" call-to-action box

### 3. Journal List (/journal) - Light & Dark

**Navigate to:** http://localhost:3000/journal

**Test Filter Panel:**
1. Click "Filters" button
2. Verify filter panel background changes with theme
3. Check all labels are readable
4. Hover over badge chips - should have subtle hover state

**Test Entry Cards:**
- ✅ Type badges (Trade Idea=blue, Trade=green, Reflection=purple, Observation=orange)
- ✅ Conviction badges (Low/Medium/High)
- ✅ Sentiment badges (positive=green, negative=red, neutral=gray)
- ✅ Bias badges (orange)
- ✅ AI tag badges (blue)
- ✅ Timestamp text is readable

**Empty State:**
- Navigate to a filtered view with no results
- Verify empty state text is readable in both modes

### 4. Navigation Bar

**Test Elements:**
- ✅ Top navigation background changes with theme
- ✅ Theme toggle button (44x44px) in top-right
- ✅ Home/Journal/Insights buttons change style when active
- ✅ Hover states work correctly
- ✅ Streak indicator (if visible) has correct colors

### 5. System Preference Detection

**Test Steps:**
1. Open browser DevTools (F12)
2. Go to Console
3. Type: `localStorage.clear()`
4. Refresh page
5. Verify app respects your OS dark mode setting

**Or:**
1. Change your OS to dark mode
2. Open app in new incognito window
3. Should default to dark mode

### 6. Persistence Test

**Test Steps:**
1. Toggle to dark mode
2. Navigate to different pages (/journal, /insights)
3. Verify dark mode persists
4. Refresh page
5. Verify dark mode is still active

### 7. Mobile Viewport (390x844)

**Test Steps:**
1. Open DevTools (F12)
2. Click device toggle (Ctrl+Shift+M)
3. Select "iPhone 14 Pro" or set 390x844
4. Verify:
   - ✅ Theme toggle button is accessible (44x44px)
   - ✅ No horizontal scroll in either theme
   - ✅ All text is readable on mobile
   - ✅ Touch targets are adequate

### 8. Console Errors Check

**Critical:**
1. Open DevTools Console (F12)
2. Toggle between light/dark modes
3. Navigate between pages
4. **Verify: ZERO errors or warnings**

**Common errors to watch for:**
- Hydration mismatches
- "Warning: Prop `theme` did not match"
- Layout shift warnings
- Missing dark mode classes

## 📊 Grading Criteria

### Grade A (90-100%)
- ✅ All elements visible in both modes
- ✅ No console errors
- ✅ Smooth transitions
- ✅ Proper contrast ratios
- ✅ System preference detection works

### Grade B (80-89%)
- ✅ Most elements work correctly
- ⚠️ 1-2 minor color issues
- ✅ No console errors
- ✅ Toggle works

### Grade C (70-79%)
- ⚠️ Some elements hard to read
- ⚠️ Console warnings present
- ✅ Basic functionality works

### Grade F (<70%)
- ❌ Major readability issues
- ❌ Console errors
- ❌ Toggle doesn't work

## 🐛 Common Issues & Fixes

### Issue: Theme toggle doesn't appear
**Fix:** Clear cache and hard refresh (Ctrl+Shift+R)

### Issue: Flash of unstyled content
**Check:** `suppressHydrationWarning` on `<html>` tag in layout.tsx

### Issue: Some text unreadable in dark mode
**Find:** Search for hardcoded `text-gray-*` without dark: variant

### Issue: Badges too bright in dark mode
**Fix:** Ensure using `*-950` shades for dark mode backgrounds

## 📸 Screenshot Checklist

Please take screenshots of:
1. Dashboard - Light mode
2. Dashboard - Dark mode
3. Journal list - Light mode
4. Journal list - Dark mode
5. Filter panel expanded - Dark mode
6. Theme toggle button (close-up)

## ✅ Final Validation

Once tested, confirm:
- [ ] Theme toggle visible and functional
- [ ] Dashboard looks good in both modes
- [ ] Journal list looks good in both modes
- [ ] Filter panel readable in dark mode
- [ ] No console errors
- [ ] Theme persists across navigation
- [ ] Mobile viewport works (390x844)
- [ ] All badges have proper dark variants

## 🎨 Color Contrast Check

Minimum WCAG AA requirements:
- Body text (16px): 4.5:1 contrast ratio
- Large text (24px+): 3:1 contrast ratio
- UI components: 3:1 contrast ratio

**Manual Check:**
1. Use browser extension like "WCAG Color Contrast Checker"
2. Check text against background in dark mode
3. Verify badge text is readable

**Expected Results:**
- `text-gray-300` on `bg-gray-900` = ✅ 8.59:1 (Excellent)
- `text-gray-400` on `bg-gray-900` = ✅ 6.37:1 (Good)
- Green/Red/Blue badge text = ✅ Should all pass

## 🚀 If Everything Passes

You're ready to:
1. Update remaining pages (insights, journal/new, journal/[id])
2. Run `/accessibility` command for full audit
3. Create screenshots for PR
4. Commit and push changes

---

**Current Implementation Status: 80% Complete**
- ✅ Core pages (Dashboard, Journal List)
- ✅ Navigation & Filters
- ⏳ Insights, Journal Entry Form, Entry Detail (need manual updates)
