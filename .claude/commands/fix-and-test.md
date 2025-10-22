# Fix and Test

Run linter, fix issues, type check, and run all tests in sequence. Fix any issues found iteratively until all checks pass.

## Prerequisites
- Ensure dev server is running in PowerShell terminal
- Verify `.env` file has required environment variables (DATABASE_URL, OPENAI_API_KEY)

## Steps

1. **Run Linter**
   - Execute `npm run lint`
   - Fix any linting errors or warnings
   - If fixes are made, re-run linter to verify

2. **Type Check**
   - Execute `npm run typecheck`
   - Fix any TypeScript type errors
   - Re-run type check to verify all errors resolved

3. **Run Test Suite**
   - Verify dev server is running on localhost:3000
   - Execute `npm run test:all` in PowerShell
   - If tests fail, analyze output and fix issues
   - Common test failures:
     - Missing dev server (start with `npm run dev`)
     - Database connection issues (verify DATABASE_URL in .env)
     - Missing OPENAI_API_KEY for AI tests
     - Stale test data (may need to reseed database)

4. **Iterative Fixing**
   - If any step fails, fix the issues and repeat from step 1
   - Continue until all linting, type checking, and tests pass
   - Run final build check: `npm run build`

5. **Report Results**
   - Summarize all fixes made
   - Confirm all checks pass
   - List any remaining warnings (if non-blocking)

## Success Criteria
- ✅ `npm run lint` - No errors or warnings
- ✅ `npm run typecheck` - No type errors
- ✅ `npm run test:all` - All tests passing
- ✅ `npm run build` - Build succeeds without errors
