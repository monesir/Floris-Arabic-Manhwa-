# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-18)

**Core value:** Reading from selected sources and managing a personal manhwa library must feel reliable, organized, and local-first without requiring any account or cloud dependency.
**Current focus:** Phase 5 - Offline and Analytics

## Current Position

Phase: 5 of 6 (Offline and Analytics)
Plan: 2 of 4 in current phase
Status: Executing remaining Phase 5 plans
Last activity: 2026-05-18 - Completed 05-02 external destination controls and retry handling

Progress: [########--] 78%

## Performance Metrics

**Velocity:**
- Total plans completed: 11
- Average duration: 21 min
- Total execution time: 3.1 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 3 | 55 min | 18 min |
| 2 | 3 | 65 min | 22 min |
| 3 | 3 | 66 min | 22 min |
| 4 | 3 | 41 min | 14 min |
| 5 | 2 | 32 min | 16 min |

**Recent Trend:**
- Last 5 plans: 13 min, 15 min, 13 min, 18 min, 14 min
- Trend: Stable; download work continues to stay within the recent execution band despite filesystem and dialog integration

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Initialization: Use Electron and a Windows-first delivery target.
- Initialization: Use a vertical MVP roadmap instead of horizontal layer-first planning.
- Initialization: Design sources as both built-in adapters and external plugins.
- Phase 1 planning: Use a real shell with smart placeholders and full navigation from day one.
- Phase 1 planning: Use a minimal real persistence schema instead of browser-only storage.
- Phase 1 planning: Treat built-in plugin runtime and external plugin validation as separate Phase 1 concerns.
- 01-01 execution: Use a real pnpm workspace with `apps/desktop` as the shell root.
- 01-01 execution: Keep the full navigation map visible now through intentional placeholder pages instead of hiding later routes.
- 01-02 execution: Use built-in `node:sqlite` for the local database because the native `better-sqlite3` path failed against the current Electron runtime.
- 01-02 execution: Use `process.env.ELECTRON_RENDERER_URL` and `../renderer/index.html` as the main-window loading path expected by `electron-vite@5`.
- 01-03 execution: Use a capability-driven shared source contract and registry-backed Plugins page.
- 01-03 execution: Discover external plugins from the app user-data `plugins` directory while keeping external runtime execution deferred.
- 02-01 execution: Normalize browse/search/title/chapter data in the main process and expose it only through preload/IPC.
- 02-01 execution: Model locked chapters explicitly in source results instead of treating them as readable pages.
- 02-02 execution: Keep browse and title details inside one route using normalized query-param state instead of adding an early dedicated title route.
- 02-03 execution: Use the existing `library_entries` identity schema now and defer richer library display data until Phase 3 expands organization features.
- 03-01 execution: Expand `library_entries` in place with persisted cover, status, and favorite fields rather than replacing the identity model.
- 03-01 execution: Keep library organization mutations library-owned and available directly from the Library route.
- 03-01 execution: Treat plugin/source bootstrap cleanup as FK-aware so referenced source rows are preserved.
- 03-02 execution: Model custom lists as first-class local entities with many-to-many membership records.
- 03-02 execution: Keep list filtering and membership management inside the Library route rather than branching into a separate screen.
- 03-03 execution: Keep tracked update state in a separate table so refresh metadata does not distort the base library entry model.
- 03-03 execution: Initialize update baselines on first refresh instead of marking the entire backlog as new.
- 04-01 execution: Add a dedicated `/reader` route with its own IPC-backed state rather than embedding reader behavior inside browse.
- 04-02 execution: Treat `RTL` as a paged reader mode while keeping app-level layout direction stable.
- 04-03 execution: Persist progress by `source_id + source_title_id` with optional library linkage and use it to power `Continue`.
- 05-01 execution: Materialize offline downloads through app-managed user-data storage before adding external destinations.
- 05-01 execution: Persist download queue state in SQLite and resume interrupted `running` jobs as `pending` on app restart.
- 05-02 execution: Treat external destination choice as an app-level preference rather than per-job ad hoc prompting.
- 05-02 execution: Retry failed jobs by resetting the persisted job state back to `pending` and re-entering the same queue processor.

### Pending Todos

- Execute 05-03 for local content import.
- Execute 05-04 for reading history and per-title time analytics.

### Blockers/Concerns

- `node:sqlite` is still experimental upstream and should be reassessed later if Electron or packaging requirements change.
- Live source markup for `azoramoon.com` and `olympustaff.com` can drift and will need periodic parser validation.
- External plugin runtime hardening remains intentionally deferred even though discovery and validation now exist.
- Verification in this shell still requires direct `.bin` command paths because `pnpm` is not on PATH.
- Local import normalization and analytics tables still need completion in the remaining Phase 5 plans.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Reader intelligence | Automatic translation | Deferred to v2 | 2026-05-18 |
| Sync | Accounts/cloud sync | Deferred to future | 2026-05-18 |
| Platform | Cross-platform support beyond Windows | Deferred to future | 2026-05-18 |

## Session Continuity

Last session: 2026-05-18
Stopped at: Completed 05-02 and prepared to continue the rest of Phase 5
Resume file: .planning/ROADMAP.md
