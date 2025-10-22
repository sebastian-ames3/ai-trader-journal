---
description: Auto-detect and fix JavaScript console errors
---

You are performing **automated console error detection and fixing** for the AI Trader Journal app.

## Task

1. **Ask user which page to check** (if not specified)
   - Default to `/journal/new` if unclear

2. **Navigate and capture console logs**:
   ```typescript
   browser_navigate to http://localhost:3000/[target-page]
   browser_console_messages
   ```

3. **Classify errors by severity**:
   - **🔴 Critical**: Uncaught errors, ReferenceErrors, TypeErrors that break functionality
   - **🟡 Warning**: React warnings (keys, exhaustive-deps, hydration)
   - **🔵 Info**: Deprecation warnings, dev-only messages

4. **For each error**:
   - Identify source file and line number
   - Use Grep to find the problematic code
   - Use Read to examine context
   - Determine root cause
   - Apply fix using Edit tool

5. **Re-validate**:
   - Refresh page in Playwright
   - Capture console logs again
   - Confirm errors are resolved

6. **Report results**:
   ```
   🐛 Console Error Fixes

   Errors Found: 3
   Errors Fixed: 2
   Remaining: 1 (requires user decision)

   ✅ FIXED:
   1. [Line 142] ReferenceError: foo is not defined
      - Removed unused variable reference
      - File: src/app/journal/new/page.tsx

   2. [Line 68] React Hook useEffect has missing dependencies
      - Added fetchEntries to dependency array
      - File: src/app/journal/page.tsx

   ⚠️ NEEDS REVIEW:
   1. [External] Third-party script error from ptxcloud.net
      - Cannot auto-fix external script
      - Recommendation: Remove or defer this script

   Re-tested: ✅ Zero console errors now
   ```

## Auto-Fix Guidelines

**Safe to auto-fix:**
- Unused imports/variables
- Missing React dependency arrays (if safe)
- Incorrect prop types
- Missing key props on lists
- Simple undefined references

**Requires user approval:**
- Logic changes that affect behavior
- External script errors
- Database/API related errors
- Anything that might change app functionality

## Output

Be direct and show before/after. If you fixed something, explain why the fix is safe. If you need approval, explain the trade-offs clearly.
