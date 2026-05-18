# Phase 1: Foundation Shell - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the initial Windows desktop application shell for FloirsMNH: a working Electron app with persistent primary navigation, local settings persistence, safe `main / preload / renderer` boundaries, and the first internal contracts that later phases will use for sources and plugins. This phase does not deliver real source browsing, reader behavior, downloads, or tracking features yet.

</domain>

<decisions>
## Implementation Decisions

### Repository and App Structure
- **D-01:** Start with a strict modular structure from day one rather than a minimal bootstrap that will need early reorganization.
- **D-02:** Use a small monorepo layout rather than a flat single-app root or aggressively split packages from the start.
- **D-03:** The desktop app lives under `apps/desktop`.
- **D-04:** Inside the desktop app, the renderer should be organized feature-first rather than layer-first.
- **D-05:** Do not extract reusable `packages/` at Phase 1 unless a concrete need appears during planning or implementation.

### Source and Shared Contracts Placement
- **D-06:** Source and plugin contracts should live in shared internal contracts inside the app, not only inside service implementations.
- **D-07:** Keep runtime implementations separate from contracts so later built-in and external plugins can conform to the same boundary.

### Settings and Shared UI Plumbing
- **D-08:** `i18n` and shared settings-facing UI plumbing should live in renderer shared code plus app-level providers, not be buried only in shell pages or only in backend-like services.
- **D-09:** Settings persistence may flow through services and preload boundaries, but the renderer owns the app-level provider model for consuming them.

### Shell and Navigation Behavior
- **D-10:** Phase 1 should ship a real application shell with smart placeholders for incomplete pages, not hide future pages and not fake broad feature completeness.
- **D-11:** The sidebar should expose the full primary navigation map from day one: `Library`, `Browse`, `Updates`, `History`, `Downloads`, `Settings`, and `Plugins`.
- **D-12:** `Settings` must be functionally real in Phase 1 for language switching and persistence smoke-path validation, not a mostly empty placeholder surface.
- **D-13:** Language switching must work for real in Phase 1, including correct Arabic text rendering while keeping the overall app layout stable rather than fully mirrored.
- **D-14:** The Phase 1 i18n structure should make adding more languages straightforward later instead of hard-coding an English/Arabic-only path.

### Identity Model
- **D-15:** Online title identity is composite: `source_id + source_title_id`.
- **D-16:** Chapter identity is composite: `title_identity + source_chapter_id`, with a controlled fallback such as slug, URL, or hash only when the source lacks a stable chapter ID.
- **D-17:** Plugin and source identity are distinct: `plugin_id + source_id`, not source-only and not file-path-derived.
- **D-18:** Library entries must have their own internal `library_entry_id` separate from source title identity.

### Persistence Spine
- **D-19:** Phase 1 should use a real local persistence spine, not temporary browser storage as the system of record.
- **D-20:** The Phase 1 schema should be minimal but real, not broad future-modeling and not settings-only.
- **D-21:** The minimal Phase 1 schema should cover `settings`, `plugin registry`, `source registry`, and `library entry skeleton`.
- **D-22:** `reading progress`, `downloads`, and `history` should be deferred as explicit future tables rather than created now as empty shells or hidden inside key-value blobs.

### Plugin Boundary
- **D-23:** Phase 1 plugin support should run built-in plugins through the core runtime while also discovering and validating external plugins.
- **D-24:** External plugins in Phase 1 should be validated and registered, but their executable runtime behavior should not yet be treated as fully active source integrations.
- **D-25:** Plugin manifests should be minimal but strict, including stable identity and compatibility information rather than broad capability sprawl.
- **D-26:** The app shell should include a real Plugins page in Phase 1 that shows built-in and external plugin entries, validation state, and failure reasons.

### Source Contract Skeleton
- **D-27:** Phase 1 should define a contract-first source model with stub-safe capability surfaces rather than only a plugin handshake and rather than a near-complete runtime.
- **D-28:** The Phase 1 source contract should cover source metadata, browse/search, title details, chapter list, chapter pages, and explicit capability flags.
- **D-29:** Capability support should be declared explicitly through flags rather than inferred only from implemented methods.
- **D-30:** Title page actions should be derived from general capabilities rather than modeled as a separate explicit actions contract in Phase 1.

### the agent's Discretion
- Exact package manager, task runner, and workspace wiring inside the small monorepo
- Exact file names for shared contract modules and provider components
- Exact SQLite access layer and migration tooling choice, as long as it preserves the Phase 1 persistence decisions above
- Exact placeholder behavior for non-implemented pages, as long as the shell and navigation are real

</decisions>

<specifics>
## Specific Ideas

- The product should remain functionally close to Houdoku at the desktop-shell level, but the early product emphasis is Arabic manhwa sources and local-first workflow quality.
- The sidebar shell is already expected to include Library, Browse, Updates, History, Downloads, Settings, and Plugins as primary destinations, even if some pages are placeholder-first in this phase.
- Arabic support should mean real Arabic text handling and later RTL reading behavior, not a full mirrored app layout.
- The Houdoku title/series page reference the user shared reinforces a page structure with a large hero/banner area, a separate cover panel, top-level actions, metadata cards, visible source labeling, genre/tag chips, and a chapter-management table as the main lower section.
- The same reference confirms that title-level actions such as `Continue`, `View`, `Trackers`, `Refresh`, and `Options` are treated as first-class page controls rather than hidden secondary actions.
- The chapter table reference also suggests future support for structured chapter columns and list controls such as filters for language and release group.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope and requirements
- `.planning/PROJECT.md` - project definition, constraints, and locked product boundaries
- `.planning/REQUIREMENTS.md` - v1 requirements and requirement-to-phase mapping
- `.planning/ROADMAP.md` - current phase goals, ordering, and success criteria
- `.planning/STATE.md` - current project state and known blockers

### Research context
- `.planning/research/SUMMARY.md` - synthesis of stack, feature, architecture, and risk guidance
- `.planning/research/STACK.md` - recommended stack direction for the desktop app
- `.planning/research/ARCHITECTURE.md` - recommended app boundaries and structure patterns
- `.planning/research/PITFALLS.md` - early-phase pitfalls that planning should actively prevent

### Reference product
- `No local external specs yet - product reference is Houdoku as discussed in project context, but its repository is an external reference rather than a local canonical file in this workspace`
- `Houdoku reference notes used in discussion:` series pages expose title-level actions such as preview/add/download behavior, chapter-table interactions, and tracker entry points; plugin-driven source support is centered around installed plugins rather than hard-coded broad source coverage
- `Houdoku title-page screenshot reference shared by user:` confirms page composition patterns including hero/banner, separate cover, metadata cards, genre tags, source badge, action bar, and chapter table controls

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet - this is a greenfield repo with no implementation code.

### Established Patterns
- None in code yet. Patterns must come from the planning artifacts and the locked decisions above.

### Integration Points
- The first implementation must establish clean boundaries among Electron `main`, `preload`, renderer app structure, local persistence, and plugin/source contract scaffolding.

</code_context>

<deferred>
## Deferred Ideas

- Real source browsing behavior belongs to Phase 2.
- Reader behavior and reading mode implementation belong to Phase 4.
- Download manager behavior belongs to Phase 5.
- Detailed external plugin runtime behavior and release hardening belong to Phase 6.
- A developer-facing skill and guide for building high-quality plugins should be handled in a later phase rather than inside the Foundation Shell phase.
- Full Houdoku-like title page fidelity, chapter-table richness, and progress-driven title actions belong to later feature phases even though the shell should be able to host that structure cleanly.

</deferred>

---

*Phase: 01-foundation-shell*
*Context gathered: 2026-05-18*
