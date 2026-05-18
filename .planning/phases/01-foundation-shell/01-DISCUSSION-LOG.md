# Phase 1: Foundation Shell - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-18
**Phase:** 01-foundation-shell
**Areas discussed:** App Structure, Persistence Spine, Plugin Boundary, Shell and Navigation Behavior, Source Contract Skeleton

---

## App Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Strict modular structure | Start with `main / preload / renderer / services / db / plugins` from day one | ✓ |
| Medium structure | Separate only `main / preload / renderer`, defer deeper modularity | |
| Minimal bootstrap | Start simple and reorganize later | |

**User's choice:** Strict modular structure
**Notes:** The user wants the foundation organized correctly from the start rather than paying an early restructure tax.

| Option | Description | Selected |
|--------|-------------|----------|
| Small monorepo | `apps/desktop` now, room for future packages later | ✓ |
| Single app repo | Flat repo with one application at root | |
| Pre-split monorepo | Immediate `packages/ui`, `packages/plugin-sdk`, etc. | |

**User's choice:** Small monorepo
**Notes:** This keeps future growth possible without premature package extraction.

| Option | Description | Selected |
|--------|-------------|----------|
| Feature-first renderer | `renderer/app`, `renderer/pages`, `renderer/features`, `renderer/shared` | ✓ |
| Layer-first renderer | `components`, `hooks`, `stores`, `pages`, `utils` | |
| Early UI package | Extract UI to a package immediately | |

**User's choice:** Feature-first renderer
**Notes:** The product is expected to grow around major feature areas such as library, reader, sources, and downloads.

| Option | Description | Selected |
|--------|-------------|----------|
| Keep packages minimal | Use internal `services/db/plugins/shared` first, no early package split | ✓ |
| Extract shared contracts early | Create `packages/contracts` or `packages/shared` now | |
| Extract plugin SDK early | Create `packages/plugin-sdk` immediately | |

**User's choice:** Keep packages minimal
**Notes:** Package extraction should be driven by actual need, not anticipated complexity.

| Option | Description | Selected |
|--------|-------------|----------|
| Shared internal contracts | Keep source/plugin contracts in shared app-internal modules | ✓ |
| Services-only contracts | Keep contracts only beside implementations | |
| Plugins-only contracts | Keep contracts under the plugin area only | |

**User's choice:** Shared internal contracts
**Notes:** Contracts should remain implementation-agnostic inside the app.

| Option | Description | Selected |
|--------|-------------|----------|
| Shared i18n + app-level providers | Keep i18n/settings UI plumbing in renderer shared + providers | ✓ |
| App shell only | Put all of it under shell code | |
| Services-first | Treat i18n/settings as service-owned first | |

**User's choice:** Shared i18n + app-level providers
**Notes:** The renderer should own app-level consumption while persistence can still travel through services/preload.

---

## Persistence Spine

| Option | Description | Selected |
|--------|-------------|----------|
| Composite title identity | `source_id + source_title_id` | ✓ |
| App-generated global ID only | Internal app identity only | |
| URL-based identity | Use title URL as primary identity | |

**User's choice:** Composite title identity
**Notes:** Source linkage must remain stable and explicit.

| Option | Description | Selected |
|--------|-------------|----------|
| Composite chapter identity | `title_identity + source_chapter_id` with fallback | ✓ |
| URL-only chapter identity | Use chapter URL as primary identity | |
| App-generated chapter ID only | Create internal IDs on ingestion | |

**User's choice:** Composite chapter identity
**Notes:** Resume, updates, and downloads all depend on chapter identity stability.

| Option | Description | Selected |
|--------|-------------|----------|
| Stable plugin ID + source ID | Distinct identities for plugin package and source | ✓ |
| Source ID only | No separate plugin identity | |
| File-path based plugin identity | Identify plugin by folder path | |

**User's choice:** Stable plugin ID + source ID
**Notes:** Needed because built-in and external plugins will coexist.

| Option | Description | Selected |
|--------|-------------|----------|
| Separate library entry ID | `library_entry_id` separate from source title identity | ✓ |
| Source title identity as library identity | No separate library entity | |
| Hybrid later | Start without separate library entry and add later | |

**User's choice:** Separate library entry ID
**Notes:** Preserves library flexibility independently of source identity.

| Option | Description | Selected |
|--------|-------------|----------|
| Real minimal schema | Create a real but narrow schema for Phase 1 | ✓ |
| Settings only | Persist only settings in Phase 1 | |
| Broad future-ready schema | Model many future tables now | |

**User's choice:** Real minimal schema
**Notes:** The user wants a real spine without over-modeling future features.

| Option | Description | Selected |
|--------|-------------|----------|
| Settings + plugin registry + source registry + library entry skeleton | Minimal useful Phase 1 schema | ✓ |
| Settings + plugin registry only | Defer library model entirely | |
| Settings + library entries + chapter skeleton | Pull chapter modeling earlier | |

**User's choice:** Settings + plugin registry + source registry + library entry skeleton
**Notes:** Enough to support later phases without dragging progress/download/history forward.

| Option | Description | Selected |
|--------|-------------|----------|
| Defer progress/download/history as explicit future tables | Plan them later, do not fake them now | ✓ |
| Create empty skeleton tables now | Stub future tables immediately | |
| Hide future data in key-value settings | Temporary blob-based storage | |

**User's choice:** Defer as explicit future tables
**Notes:** The user explicitly avoided placeholder hacks and premature tables.

---

## Plugin Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Manifest + discovery + validation only | No built-in runtime behavior yet | |
| Built-in runtime + external discovery/validation | Built-in works, externals are discovered and validated | ✓ |
| Full plugin runtime from Phase 1 | Treat built-in and external equally from the start | |

**User's choice:** Built-in runtime + external discovery/validation
**Notes:** The user initially mistyped their answer, then clarified they meant option B.

| Option | Description | Selected |
|--------|-------------|----------|
| Validate/register external plugins only | Discover and validate, but do not execute external plugin logic yet | ✓ |
| Limited external execution | Allow some external runtime behavior after validation | |
| Same as built-in | Externals execute just like built-ins immediately | |

**User's choice:** Validate/register external plugins only
**Notes:** Full external runtime belongs to later hardening phases.

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal but strict manifest | Stable identity, version, compatibility, source list | ✓ |
| Rich early manifest | Large capabilities and permissions surface immediately | |
| Very thin manifest | Bare-minimum `name` and entrypoint | |

**User's choice:** Minimal but strict manifest
**Notes:** The manifest should be tight enough to validate safely without overdesigning the ecosystem.

| Option | Description | Selected |
|--------|-------------|----------|
| Real Plugins page with status states | Show built-in/external plugins and validation outcomes in shell | ✓ |
| Hidden diagnostics only | No visible plugins page yet | |
| Minimal Settings subsection | No dedicated Plugins page | |

**User's choice:** Real Plugins page with status states
**Notes:** The plugins surface should exist as a real part of the shell from Phase 1.

---

## Shell and Navigation Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Real shell with smart placeholders | Full navigation exists; incomplete pages explain their status clearly | ✓ |
| Only core pages visible | Hide future pages | |
| All pages semi-real | Broaden partial behavior everywhere | |

**User's choice:** Real shell with smart placeholders
**Notes:** The user wants a true shell, not a fake demo or a reduced nav map.

| Option | Description | Selected |
|--------|-------------|----------|
| Full final navigation map from day one | `Library`, `Browse`, `Updates`, `History`, `Downloads`, `Settings`, `Plugins` | ✓ |
| Core-first navigation | Show only currently implemented sections | |
| Grouped expandable navigation | Add collapsible information architecture now | |

**User's choice:** Full final navigation map from day one
**Notes:** The shell should resemble the final application map even before deeper features arrive.

| Option | Description | Selected |
|--------|-------------|----------|
| Real settings for language + persistence smoke path | Settings must prove persistence and language switching | ✓ |
| Mostly placeholder settings | Minimal real settings behavior | |
| Broad settings early | Many real settings sections immediately | |

**User's choice:** Real settings for language + persistence smoke path
**Notes:** This directly supports the shell and persistence requirements of Phase 1.

| Option | Description | Selected |
|--------|-------------|----------|
| Real language switching + Arabic text rendering + stable layout | Actual switching works, but no full layout mirroring | ✓ |
| Language infrastructure only | Plumbing without real switching | |
| Full bilingual polish immediately | Stronger localization scope in Phase 1 | |

**User's choice:** Real language switching + Arabic text rendering + stable layout
**Notes:** The user also requested that the i18n path remain easy to extend to more languages later.

---

## Source Contract Skeleton

| Option | Description | Selected |
|--------|-------------|----------|
| Contract-first with stubbed capabilities | Define a real source shape now, allow stub-safe implementation surfaces | ✓ |
| Minimal plugin handshake only | No serious source contract yet | |
| Near-complete source contract | Push much deeper source semantics into Phase 1 | |

**User's choice:** Contract-first with stubbed capabilities
**Notes:** Phase 1 should lock the shape without pretending Phase 2 source behavior is already finished.

| Option | Description | Selected |
|--------|-------------|----------|
| Metadata + browse/search + title details + chapter list + chapter pages + capability flags | Full read-oriented contract shape, minus deeper download runtime | ✓ |
| Metadata + browse/search only | Narrow Phase 1 contract | |
| Full contract including download/export hooks | Pull download semantics in immediately | |

**User's choice:** Metadata + browse/search + title details + chapter list + chapter pages + capability flags
**Notes:** This aligns with the later title-page and reader expectations.

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit capability flags | The source declares what it supports | ✓ |
| Infer from implemented methods | Capability inferred structurally | |
| Mixed model | Both methods and flags without one clear source of truth | |

**User's choice:** Explicit capability flags
**Notes:** This also supports clearer plugin status presentation in the Plugins page.

| Option | Description | Selected |
|--------|-------------|----------|
| Actions derived from capabilities | Title page actions come from general capabilities | ✓ |
| Explicit title actions model | A separate action contract declares `preview/read/download` | |
| Mixed model | Capabilities plus some explicit title actions | |

**User's choice:** Actions derived from capabilities
**Notes:** This followed a review of Houdoku's title-page behavior and keeps Phase 1 cleaner.

## the agent's Discretion

- Exact package manager and workspace tooling
- Exact SQLite library, migration tooling, and file naming
- Exact placeholder UX copy for incomplete shell pages
- Exact internal file names for shared contracts and providers

## Deferred Ideas

- Developer-facing skill and guide for building high-quality plugins
- Full Houdoku-like title page fidelity and chapter-table richness
- Detailed external plugin runtime execution
