# Learnings & Conventions

## Purpose
Capture gotchas, conventions, and lessons learned during development. Claude should reference this before making changes.

---

## Environment
- **Use PowerShell** - WSL has Supabase networking issues
- **Path alias:** `@/*` maps to `./src/*`
- Database URL requires `?pgbouncer=true` for Supabase

## Git Workflow
- Feature branches -> PR -> main
- Commit format includes Claude Code attribution
- Never force push to main

## Code Conventions
- Mobile-first: Design for 390x844 viewport
- Touch targets: Minimum 44px
- Entry types have specific colors (TRADE_IDEA=blue, TRADE=green, etc.)
- shadcn/ui components in `src/components/ui/`

## API Patterns
- Use date-fns for date manipulation
- Claude Haiku for quick inference, Sonnet for vision/analysis
- API routes use Next.js App Router conventions

## Testing
- **Baseline validation:** `npm run typecheck && npm run build` - this is the minimum gate
- **API tests require dev server:** Run `npm run dev` in a separate terminal before running `npm run test:*` commands
- **Jest not installed:** The `npm test` command is defined but Jest is not in devDependencies
- **Working tests:** `npm run test:theses`, `npm run test:api`, etc. (require dev server)

## Known Pitfalls
- Static generation fails for database-dependent routes (fixed in c79666d)
- WSL cannot reach Supabase - always use PowerShell
- Voice transcription requires OpenAI API key
- API tests fail with "fetch failed" if dev server not running

---

## Changelog
| Date | Learning | Context |
|------|----------|---------|
| 2024-12 | WSL networking issue | Supabase connection failures |
| 2024-12 | Static route fix | PR #90 |
| 2024-12 | Test requirements documented | BUG_001 - tests need dev server |
