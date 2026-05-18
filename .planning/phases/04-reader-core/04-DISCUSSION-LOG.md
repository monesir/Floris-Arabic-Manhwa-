# Phase 4 Discussion Log

## Inputs Used

- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- existing Phase 1 to Phase 3 implementation in `apps/desktop/src`
- prior project decisions already captured during earlier discussion turns

## What Was Resolved From Existing Context

- the reader must be a real route, not a modal inside browse
- all four reading modes are required in this phase
- the reader settings surface belongs in a side panel
- progress must persist automatically and power `Continue`
- title details are the main launch surface for reading actions

## Assumptions Chosen To Avoid Blocking

- use a dedicated progress table instead of overloading `library_entries`
- keep reader preferences global for now
- start first-time reading from the oldest readable chapter
- treat `RTL` as a paged reader mode rather than as a global layout reversal

## Open Matters Deferred To Implementation Detail

- exact scroll-restoration heuristic for long image pages
- whether library cards should also expose `Continue` in this phase
- whether reader-specific keyboard shortcuts need more than basic arrow support
