# Known Bugs

## Priority Levels
- **P0** - Blocking ship, fix immediately
- **P1** - Must fix before ship
- **P2** - Should fix, not blocking
- **P3** - Nice to have

---

## Active Bugs

### BUG_001: Tests fail without dev server running
- **Priority:** P2 (downgraded - workaround documented)
- **Status:** Mitigated
- **Spec:** `/process/specs/BUG_001.md`
- **Description:** API tests require `npm run dev` to be running, Jest not installed
- **Resolution:** Test requirements documented in LEARNINGS.md; baseline validation is `npm run typecheck && npm run build`

---

## Resolved Bugs

(None yet)

---

## Notes
- Add new bugs with incrementing IDs (BUG_002, BUG_003, etc.)
- Each bug should have a corresponding spec file in `/process/specs/`
- Update status as bugs are investigated and fixed
