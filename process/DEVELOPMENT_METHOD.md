# Development Method (Structured AI-First)

## Objective
Move from prototype/vibe-coding to reliable shipping by:
1) freezing scope, 2) converting remaining work into small specs, 3) validating each change.

## Rules (Non-negotiable)
- Work is done only via a SPEC (feature/bug/refactor).
- One task at a time. No batching.
- Do not refactor or “improve” unrelated code unless the SPEC explicitly requests it.
- Never merge code that cannot be explained in plain language.
- Every completed SPEC updates: SHIP_CHECKLIST + LEARNINGS (if applicable).

## Workflow
1. Select next task:
   - Prefer SHIP_CHECKLIST items, then BUGS marked P0/P1.
2. Write or update a SPEC in /process/specs/.
3. Implementation:
   - Make minimal changes required to satisfy acceptance criteria.
   - List files changed and why.
4. Validation:
   - Run the app.
   - Verify acceptance criteria.
   - Add/adjust at least one smoke test if applicable.
5. Closeout:
   - Mark checklist item complete or update BUGS with new findings.
   - Append key conventions/gotchas to LEARNINGS.

## Definition of "Shippable"
Shippable means SHIP_CHECKLIST is fully green.
