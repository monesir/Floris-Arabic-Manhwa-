# Project Research Summary

**Project:** FloirsMNH
**Domain:** Windows-first desktop manhwa reader and library manager
**Researched:** 2026-05-18
**Confidence:** MEDIUM

## Executive Summary

This product fits the pattern of a local-first Electron desktop reader with a web-style renderer UI and a narrow privileged bridge to native functionality. The reference product, Houdoku, validates the general shape: Electron desktop shell, plugin-capable content-source model, filesystem import, offline downloads, and a customizable reader. For FloirsMNH, the most important divergence is not the shell but the domain emphasis: Arabic manhwa sources, richer tracking, and explicit reading-time analytics.

The recommended approach is to avoid copying Houdoku's lighter persistence strategy and instead adopt a stronger local data model from the beginning. A publishable Windows app with custom lists, downloads, progress recovery, history, and analytics should not treat persistence as an implementation detail. The architecture should therefore center on a typed source adapter contract, a local database-backed domain model, and a strict Electron main/preload/renderer boundary.

The main risks are source fragility, over-permissive plugin design, weak persistence for reading/download state, and superficial Arabic support. The roadmap should therefore validate the shell and data model first, then prove a small number of real Arabic sources, then build the reading loop, and only after that widen into imports, downloads, and external plugin hardening.

## Key Findings

### Recommended Stack

The app should use Electron plus a React/TypeScript renderer, with SQLite-backed local persistence rather than `localStorage`. Electron's official process model strongly favors a narrow main-process boundary with preload-exposed APIs rather than direct renderer access to Node or filesystem APIs. This is especially important for a product expected to load plugins and write downloaded chapter assets.

**Core technologies:**
- Electron 42.1.0: desktop shell and native APIs - required by product direction
- React 19.2.6: renderer UI - mature fit for app shell and reader workflows
- TypeScript 6.0.3: contracts and maintainability - critical for plugins and IPC
- SQLite via `better-sqlite3` 12.10.0: durable local persistence - needed for publishable local-first behavior

### Expected Features

The research confirms that source browsing, add-to-library, chapter details, a configurable reader, offline downloads, and library organization are table stakes. FloirsMNH's competitive emphasis should be Arabic-source quality, analytics, and strong custom organization rather than broad source count in v1.

**Must have (table stakes):**
- Browse supported sources and add titles to the library - users expect this as the core loop
- Resume reading with saved progress - a dedicated reader app is judged heavily on this
- Offline downloads and import support - expected desktop value
- Library organization with filters/lists/statuses - required once libraries grow

**Should have (competitive):**
- Reading time analytics and history log - explicitly requested and product-shaping
- Built-in plus external plugin model - strategic extensibility
- New chapter indicators on covers - keeps updates visible inside the main workflow

**Defer (v2+):**
- Automatic translation features - not essential for launch
- Accounts and cloud sync - directly conflicts with current MVP boundary

### Architecture Approach

The system should be organized around a renderer-first UX backed by explicit domain services and repositories. Main process concerns should remain limited to lifecycle, privileged filesystem operations, and plugin/native entrypoints. Source adapters and plugins should return normalized title/chapter payloads so library, downloads, and reader flows do not become source-specific.

**Major components:**
1. Source runtime - browsing, title lookup, chapter resolution, and normalized adapter outputs
2. Library/tracking persistence - titles, lists, progress, history, and analytics
3. Reader and download services - chapter display, resume logic, queueing, and offline assets
4. Plugin manager - validates and loads built-in/external source implementations

### Critical Pitfalls

1. **Source logic leaking into UI** - avoid by centralizing adapters and normalized services
2. **Weak persistence for core state** - avoid by using SQLite-backed repositories early
3. **Plugin system too open too early** - avoid with a constrained manifest and runtime validation
4. **Downloads treated as button side effects** - avoid with explicit job models and durable queue state
5. **Arabic support only at the string level** - avoid with real mixed-direction and reader-mode validation

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation Shell and Data Spine
**Rationale:** The app needs a reliable shell, database-backed local model, and safe Electron boundaries before feature sprawl starts.
**Delivers:** App shell, persistence model, settings shell, language plumbing, plugin contract skeleton
**Addresses:** durability, security boundary, and plugin/runtime drift risks
**Avoids:** weak persistence and renderer privilege leakage

### Phase 2: Online Source Browse MVP
**Rationale:** The first real product proof is reading candidates coming from named Arabic sites, not abstract architecture alone.
**Delivers:** Initial source adapters, browse/search/detail fetch, add-to-library flow
**Uses:** source adapter contract and normalized persistence
**Implements:** source runtime

### Phase 3: Library and Updates Workflow
**Rationale:** Once titles can be added, the user needs the retained-value loop of organization and visible updates.
**Delivers:** library management, statuses, lists, custom ordering, update indicators
**Uses:** local persistence and source refresh metadata

### Phase 4: Reader and Progress Engine
**Rationale:** The core usage path must become truly usable before expanding distribution features.
**Delivers:** reader modes, side-panel settings, resume position, session timing, details-to-reader loop
**Uses:** progress and analytics persistence

### Phase 5: Downloads and Local Import
**Rationale:** Offline value and archive import are major desktop expectations, but they rely on stable title/chapter models first.
**Delivers:** durable download manager, storage destinations, folder/CBZ/PDF import
**Uses:** source chapter resolution and persistence

### Phase 6: Plugin Hardening and Release Readiness
**Rationale:** External extensibility and distribution should come after the app's core model is proven internally.
**Delivers:** external plugin loading, validation UX, packaging/distribution hardening, stability polish
**Uses:** established adapter contract and native packaging flow

### Phase Ordering Rationale

- Local data durability must precede deeper feature work because progress, downloads, and analytics depend on it.
- Source runtime must exist before library updates, reader flow, and downloads can be made coherent.
- Reader and import/download concerns are separated so that the core online reading loop stabilizes before asset-heavy features widen the surface area.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** Site-specific source extraction details for the initial Arabic websites
- **Phase 5:** Import normalization rules for CBZ/PDF/folder content and download storage policies
- **Phase 6:** External plugin packaging, compatibility, and safety boundaries

Phases with standard patterns (skip research-phase):
- **Phase 1:** Electron shell, database wiring, and typed IPC are standard enough
- **Phase 3:** Library organization patterns are straightforward once the domain model exists

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Electron guidance is high confidence; exact library choices beyond that are strong recommendations rather than mandates |
| Features | HIGH | Derived from explicit user scope plus reference-product parity |
| Architecture | MEDIUM | Solid pattern confidence, but plugin boundary details still need implementation-time refinement |
| Pitfalls | MEDIUM | Based on domain-typical failure modes and the chosen product shape |

**Overall confidence:** MEDIUM

### Gaps to Address

- External plugin trust model: decide how permissive runtime loading should be during planning
- Source extraction strategy per named site: validate HTML/API patterns before implementation plans
- Release mechanics: Windows packaging, updates, and any signing/distribution choices still need project-phase planning

## Sources

### Primary (HIGH confidence)
- [Electron Docs](https://www.electronjs.org/docs/latest/) - official product model and tooling references
- [Electron Process Model](https://www.electronjs.org/docs/latest/tutorial/process-model) - verified boundary and preload guidance

### Secondary (MEDIUM confidence)
- [Houdoku README](https://github.com/xgi/houdoku) - reference product capabilities and plugin/source structure
- `npm view` package metadata on 2026-05-18 - current package versions for stack recommendations

### Tertiary (LOW confidence)
- Inference from similar reader-manager products - useful for roadmap shaping, but still needs validation during implementation

---
*Research completed: 2026-05-18*
*Ready for roadmap: yes*
