# Phase 3 Discussion Log

## Inputs Used

- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- current Phase 2 implementation in `apps/desktop/src`

## What Was Resolved From Existing Context

- Phase 2 already established the browse-to-library persistence boundary
- the next meaningful step is not reader work, but making the library itself useful
- current library persistence is intentionally minimal and therefore insufficient for `LIB-01` through `LIB-06`
- `Updates` depends on persisted library ownership plus refresh comparison against live source chapter data

## Assumptions Chosen To Avoid Blocking

- standard reading statuses will be used in the first library management pass
- favorites remain a simple boolean on the library entry
- custom lists will be implemented as first-class local entities with membership join records
- update detection will compare current source chapter tops against the saved known-latest chapter state

## Open Matters Deferred To Implementation Detail

- exact visual styling of status chips and badges
- whether update counts are stored denormalized or derived at read time
- whether cover snapshots are persisted as direct URLs only or accompanied by more cached metadata
