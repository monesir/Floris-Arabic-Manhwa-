# Roadmap: FloirsMNH

## Overview

FloirsMNH should be built as a vertical MVP desktop product: first establish a reliable Windows/Electron shell and local data model, then prove real Arabic-source browsing, then make the library and reader genuinely usable, and only after that widen into imports, downloads, analytics polish, and external plugin hardening. Each phase should leave the app in a state that is more usable end-to-end than before, rather than accumulating disconnected technical layers.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation Shell** - establish the app shell, persistence spine, and safe Electron boundaries
- [x] **Phase 2: Source Browse MVP** - prove the first real online source workflows end to end
- [ ] **Phase 3: Library Workflow** - make saved titles organized, trackable, and visibly updated
- [ ] **Phase 4: Reader Core** - deliver the main reading experience with progress persistence and viewing modes
- [ ] **Phase 5: Offline and Analytics** - add downloads, local imports, history, and reading-time tracking
- [ ] **Phase 6: Plugin Hardening and Release Readiness** - support external plugins safely and prepare the app for distribution

## Phase Details

### Phase 1: Foundation Shell
**Goal:** Deliver a Windows desktop shell with persistent navigation, local settings persistence, safe Electron process boundaries, and the internal contracts needed for sources and plugins.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: [PLAT-01, PLAT-02, PLAT-03, PLUG-01]
**Success Criteria** (what must be TRUE):
1. User can launch the app and navigate among the planned primary pages from a persistent sidebar.
2. User can change and persist core settings, including language-related behavior, across restarts.
3. The codebase has a working built-in source adapter contract and safe preload/IPC boundaries instead of direct renderer privilege access.
**Plans**: 3 plans

Plans:
- [x] 01-01: Bootstrap the Electron, React, and TypeScript app shell with the core route/page structure.
- [x] 01-02: Establish local persistence, schema/repository foundations, and settings storage.
- [x] 01-03: Implement preload/IPC boundaries plus the built-in source adapter contract skeleton.

### Phase 2: Source Browse MVP
**Goal:** Let the user browse initial Arabic sources, search them, inspect title details, and add titles to the local library.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: [SRC-01, SRC-02, SRC-03, TITLE-01]
**Success Criteria** (what must be TRUE):
1. User can browse at least the initial supported Arabic sources and open titles from them.
2. User can search inside a supported source and reach a normalized title details view.
3. User can add a title from source browsing into the persistent local library.
**Plans**: 3 plans

Plans:
- [x] 02-01: Implement the normalized source runtime and the first site adapters.
- [x] 02-02: Build browse/search/detail flows for supported sources in the renderer UI.
- [x] 02-03: Connect add-to-library behavior to the persistent library model.

### Phase 3: Library Workflow
**Goal:** Make the saved library useful through organization, statuses, custom lists, and update visibility.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: [LIB-01, LIB-02, LIB-03, LIB-04, LIB-05, LIB-06, UPDT-01]
**Success Criteria** (what must be TRUE):
1. User can view a persistent cover-based library and organize it with search, sorting, filtering, statuses, favorites, and custom lists.
2. User can detect recently updated titles from the library itself via visible new-chapter indicators.
3. User can open an Updates view showing tracked title changes without losing the library workflow.
**Plans**: 3 plans

Plans:
- [x] 03-01: Implement the library index, filters, sorting, favorites, and reading-status management.
- [ ] 03-02: Add custom lists and related library organization flows.
- [ ] 03-03: Implement source refresh/update detection and expose it in the library and Updates views.

### Phase 4: Reader Core
**Goal:** Deliver a real reading experience with multiple modes, chapter navigation, and reliable resume behavior.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: [READ-01, READ-02, READ-03, READ-04, READ-05, TITLE-02]
**Success Criteria** (what must be TRUE):
1. User can open a chapter from the title details page and read it in a dedicated reader with a side settings panel.
2. User can switch among vertical, horizontal paged, RTL, and long-strip modes with expected zoom and fit controls.
3. User can close and reopen the app and continue from the correct chapter and in-chapter position.
**Plans**: 3 plans

Plans:
- [ ] 04-01: Build the reader page, chapter asset loading, and side settings panel.
- [ ] 04-02: Implement reading modes, navigation, zoom, and fit behavior.
- [ ] 04-03: Persist progress and wire the Continue/Read loop from title details into the reader.

### Phase 5: Offline and Analytics
**Goal:** Add durable download management, local content import, and the requested reading history and time analytics.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: [DL-01, DL-02, DL-03, DL-04, IMP-01, IMP-02, TRK-01, TRK-02, TRK-03]
**Success Criteria** (what must be TRUE):
1. User can queue chapter downloads, monitor their states, retry failures, and use either app-managed or external destinations.
2. User can import local chapter/image folders, `CBZ`, and `PDF` content into the library model.
3. User can view reading history and total reading time per title from the app's analytics-facing surfaces.
**Plans**: 4 plans

Plans:
- [ ] 05-01: Implement the download job model, queue UI, and persistent download state.
- [ ] 05-02: Add download destination controls and failure/retry handling.
- [ ] 05-03: Implement local import normalization for folders, `CBZ`, and `PDF`.
- [ ] 05-04: Add reading history, session timing, and per-title analytics surfaces.

### Phase 6: Plugin Hardening and Release Readiness
**Goal:** Safely support external plugins and harden the app for real Windows distribution.
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: [PLUG-02]
**Success Criteria** (what must be TRUE):
1. User can place an external plugin in the plugins directory and the app validates and reports its status safely.
2. Invalid plugins fail with understandable diagnostics rather than crashing the main app.
3. The app is prepared for Windows packaging and distribution with a release-oriented build path.
**Plans**: 3 plans

Plans:
- [ ] 06-01: Implement plugin discovery, manifest validation, and bounded runtime loading.
- [ ] 06-02: Build plugin status/error UX and compatibility reporting.
- [ ] 06-03: Harden Windows packaging, release configuration, and distribution readiness.

## Progress

**Execution Order:**
Phases execute in numeric order: 2 -> 2.1 -> 2.2 -> 3 -> 3.1 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation Shell | 3/3 | Complete | 2026-05-18 |
| 2. Source Browse MVP | 3/3 | Complete | 2026-05-18 |
| 3. Library Workflow | 1/3 | In progress | 2026-05-18 |
| 4. Reader Core | 0/3 | Not started | - |
| 5. Offline and Analytics | 0/4 | Not started | - |
| 6. Plugin Hardening and Release Readiness | 0/3 | Not started | - |
