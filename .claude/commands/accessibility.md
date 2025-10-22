---
description: WCAG 2.1 AA accessibility audit
---

You are performing a **comprehensive accessibility audit** for the AI Trader Journal app using WCAG 2.1 Level AA standards.

## Task

1. **Ask user which page to audit** (if not specified)

2. **Navigate and capture**:
   ```typescript
   browser_navigate to http://localhost:3000/[target-page]
   browser_take_screenshot with fullPage=true
   ```

3. **Audit checklist** (from CLAUDE.md):

   **Color Contrast:**
   - [ ] Body text: ≥4.5:1 contrast ratio
   - [ ] Large text (18px+): ≥3:1 contrast ratio
   - [ ] UI components: ≥3:1 against background
   - Use screenshot to identify text/background color combinations
   - Calculate contrast ratios (use standard formula or estimate from HSL values)

   **Alt Text & Labels:**
   - [ ] All images have alt attributes
   - [ ] All icons have aria-label or aria-labelledby
   - [ ] All form inputs have associated `<label>` elements
   - [ ] Label `htmlFor` matches input `id`
   - Use Grep to find `<img>`, `<Icon>`, `<Input>` without proper labels

   **Semantic HTML:**
   - [ ] Proper heading hierarchy (h1 → h2 → h3, no skips)
   - [ ] Buttons are `<button>`, not `<div onClick>`
   - [ ] Links are `<a href>`, not `<span onClick>`
   - [ ] Use Read to check page structure

   **Keyboard Navigation:**
   - [ ] All interactive elements focusable (test with Tab key)
   - [ ] Focus indicators visible (check screenshot for focus rings)
   - [ ] No keyboard traps
   - Use Playwright to navigate with keyboard:
   ```typescript
   browser_press_key Tab
   browser_take_screenshot  // Check focus indicator
   ```

   **Form Accessibility:**
   - [ ] Required fields marked with `aria-required` or `required`
   - [ ] Error messages associated with fields via `aria-describedby`
   - [ ] Fieldset/legend for grouped inputs
   - [ ] Autocomplete attributes where appropriate

4. **Generate report**:

```
♿ Accessibility Audit Report (WCAG 2.1 AA)

Page: /journal/new
Overall Grade: B+

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ PASSES (7/10 criteria)
• Body text contrast: 18.5:1 (far exceeds 4.5:1) ✓
• Heading hierarchy: h1 → label text (proper structure) ✓
• Buttons are semantic <button> elements ✓
• Form labels properly associated (htmlFor/id) ✓
• Focus indicators visible on all inputs ✓
• No keyboard traps detected ✓
• Required fields marked with required attribute ✓

❌ FAILURES (3/10 criteria)
1. [HIGH] Mood emojis missing aria-label
   - Location: src/app/journal/new/page.tsx:238
   - Current: <span className="text-xl">{m.emoji}</span>
   - Fix: <span className="text-xl" role="img" aria-label={m.label}>{m.emoji}</span>
   - Impact: Screen readers can't describe mood options

2. [MEDIUM] Submit button lacks descriptive label when loading
   - Location: src/app/journal/new/page.tsx:333
   - Current: "Saving..." with spinner icon
   - Fix: Add aria-label="Saving journal entry, please wait"
   - Impact: Screen reader users don't know what's being saved

3. [LOW] Color contrast on muted text is 3.8:1 (below 4.5:1)
   - Location: Character count text (line 220)
   - Current: text-gray-500 on white (HSL 0 0% 45% = #737373)
   - Fix: Change to text-gray-600 (HSL 0 0% 38% = #5C5C5C) for 5.2:1 ratio
   - Impact: Low vision users may struggle to read character count

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 RECOMMENDED FIXES (Priority Order)
1. Add aria-labels to mood emojis (HIGH - affects all screen reader users)
2. Improve loading state labels (MEDIUM - affects context awareness)
3. Darken muted text for better contrast (LOW - affects edge cases)

🎯 TO ACHIEVE A-GRADE:
- Fix all 3 failures above
- Add landmark regions (<main>, <nav>) to page structure
- Consider adding skip-to-content link for keyboard users

Would you like me to apply these fixes automatically?
```

## Contrast Ratio Calculation

Use this formula to estimate from HSL values:
- **Excellent**: >7:1 (AAA standard)
- **Good**: 4.5:1 to 7:1 (AA standard for body text)
- **Marginal**: 3:1 to 4.5:1 (AA for large text only)
- **Fail**: <3:1 (does not meet WCAG standards)

For text-gray-500 (45% lightness) on white (100% lightness):
- Estimated contrast: ~3.9:1 (below 4.5:1 standard)

## Output Guidelines

- **Visual**: Show screenshots with focus indicators visible
- **Specific**: Reference exact line numbers and current code
- **Impact-oriented**: Explain which users are affected and how
- **Actionable**: Provide copy-paste ready fixes
- **Educational**: Briefly explain why each fix matters

Focus on real accessibility barriers, not pedantic compliance. The goal is making the app usable for everyone, not just passing automated checkers.
