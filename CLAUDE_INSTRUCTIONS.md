# Claude Instructions (Read First)

You are working in an existing codebase. Follow the repo's development method.

## Source of truth
- /process/DEVELOPMENT_METHOD.md
- /process/PROJECT.md
- /process/ARCHITECTURE.md
- /process/SHIP_CHECKLIST.md
- /process/BUGS.md
- /process/LEARNINGS.md
- The current SPEC in /process/specs/ (I will name it)

## Operating rules
- Do NOT change files outside the SPEC's allowed scope.
- Do NOT refactor, rename, or reformat unrelated code.
- Prefer small, reversible commits.
- If requirements are ambiguous, ask targeted questions OR propose 2 options with tradeoffs.
- Before implementing, restate: goal, acceptance criteria, files to change, risks.

## Output format for each task
1) Plan (bullets)
2) Changes made (files + summary)
3) How to verify (exact commands / steps)
4) Risks / follow-ups
