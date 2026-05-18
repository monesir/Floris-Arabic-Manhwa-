# Architecture Research

**Domain:** Windows-first desktop manhwa reader and library manager
**Researched:** 2026-05-18
**Confidence:** MEDIUM

## Standard Architecture

### System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                    Electron Main Process                   │
├─────────────────────────────────────────────────────────────┤
│ Window lifecycle │ app menus │ native dialogs │ packaging │
│ preload wiring   │ IPC broker │ filesystem entrypoints     │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│                    React Renderer App                      │
├─────────────────────────────────────────────────────────────┤
│ Sidebar shell │ Library │ Browse │ Reader │ Downloads      │
│ Updates       │ History │ Plugins │ Settings               │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│                   Application Services                      │
├─────────────────────────────────────────────────────────────┤
│ Source runtime │ Library service │ Reader tracking service │
│ Download manager │ Import service │ Plugin manager         │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│                     Local Persistence                       │
├─────────────────────────────────────────────────────────────┤
│ SQLite data │ cached covers │ downloaded assets │ logs     │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Main process | Own native app lifecycle and privileged filesystem/Desktop APIs | Electron `app`, `BrowserWindow`, IPC handlers |
| Preload bridge | Expose narrow safe APIs to renderer | `contextBridge` plus typed request/response contracts |
| Renderer app | All product UI and user workflows | React pages, components, state stores, query cache |
| Source runtime | Normalize source browsing, chapter lists, and chapter asset retrieval | Adapter/plugin contract with validation |
| Download manager | Queue chapter downloads, retry failures, and manage destinations | Service module plus background worker/utility process when needed |
| Library/tracking service | Persist titles, lists, statuses, progress, history, analytics | SQLite repository layer |
| Plugin manager | Load/validate built-in and external plugin manifests and runtime hooks | Manifest loader + adapter sandbox/guard rails |

## Recommended Project Structure

```text
apps/
`-- desktop/
    |-- src/
    |   |-- main/            # Electron main process
    |   |-- preload/         # Safe renderer bridge APIs
    |   |-- renderer/
    |   |   |-- app/         # Shell, routing, providers
    |   |   |-- pages/       # Library, Browse, Reader, Downloads, etc.
    |   |   |-- features/    # Library, reader, sources, plugins, downloads
    |   |   `-- shared/      # UI kit, helpers, i18n, types
    |   |-- services/        # Source runtime, downloads, imports, tracking
    |   |-- db/              # Schema, repositories, migrations
    |   `-- plugins/         # Built-in plugin/adapter implementations
    `-- tests/               # E2E and integration tests
```

### Structure Rationale

- **`main/` and `preload/`:** keep privileged Electron concerns away from renderer code.
- **`features/`:** organize by domain workflow, not by low-level file type only.
- **`services/` and `db/`:** give source, download, and tracking logic stable non-UI homes.
- **`plugins/`:** keeps extension contracts and built-in adapters under the same conceptual boundary.

## Architectural Patterns

### Pattern 1: Typed IPC Boundary

**What:** Renderer never reaches Node or Electron APIs directly; all privileged operations cross a typed bridge.
**When to use:** Always for filesystem, plugin loading, native dialogs, and download destinations.
**Trade-offs:** Slightly more boilerplate, much better safety and clarity.

### Pattern 2: Adapter Contract for Sources

**What:** Each source implements the same browse/search/title/chapter/download shape.
**When to use:** For built-in sources and external plugins alike.
**Trade-offs:** Requires stronger upfront contract design, but avoids source-specific sprawl.

### Pattern 3: Local Repository Layer

**What:** UI and services do not issue raw persistence logic everywhere; they call repositories/services.
**When to use:** For library, reading history, custom lists, download jobs, and analytics.
**Trade-offs:** More structure early, much lower migration pain later.

## Data Flow

### Request Flow

```text
User action
    ↓
Renderer page
    ↓
Feature action/service
    ↓
IPC bridge or local repository
    ↓
Source adapter / filesystem / SQLite
    ↓
Normalized result back to renderer state
```

### State Management

```text
Persistent state: SQLite
Ephemeral UI state: local store
Async source/cache state: query cache
```

### Key Data Flows

1. **Browse source to library:** source adapter returns normalized title data, user adds title, library repository persists title and source link.
2. **Read chapter:** reader loads chapter pages, progress service checkpoints chapter and in-chapter position, analytics timer records session time.
3. **Download chapter:** download manager resolves assets from source adapter, writes them to configured storage, then updates queue/item state.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Single-user desktop MVP | Monolithic desktop app with embedded SQLite is sufficient |
| Larger local libraries | Optimize image caching, pagination, and index-heavy library queries |
| More sources/plugins | Harden plugin validation, logging, and failure isolation |

### Scaling Priorities

1. **First bottleneck:** source fragility and parsing breakage, not raw traffic scale.
2. **Second bottleneck:** local asset/cache growth and library query performance.

## Anti-Patterns

### Anti-Pattern 1: UI Owns Source Logic

**What people do:** Put scraping, parsing, and normalization directly inside page components.
**Why it's wrong:** Makes source breakage contaminate UI and blocks plugin reuse.
**Do this instead:** Keep source logic behind an adapter/service contract.

### Anti-Pattern 2: Unstructured Download State

**What people do:** Track downloads only in memory.
**Why it's wrong:** Users lose state after restart and retries become unreliable.
**Do this instead:** Persist download jobs and item states locally.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Arabic manhwa websites | Source adapter contract | Treat each site as unstable HTML input that can change without notice. |
| External plugins | Manifest plus validated runtime hooks | Keep plugin privileges narrow and explicit. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Renderer ↔ Main | Typed IPC via preload | Required for security and native access |
| Source runtime ↔ Library service | Internal service contracts | Must normalize title/chapter identities consistently |
| Download manager ↔ Persistence | Repository APIs | Needed for recoverable queue state |

## Sources

- [Electron Process Model](https://www.electronjs.org/docs/latest/tutorial/process-model) - process roles, preload, and utility-process guidance
- [Houdoku README](https://github.com/xgi/houdoku) - renderer-heavy Electron app with plugin/content-source model

---
*Architecture research for: Windows-first desktop manhwa reader and library manager*
*Researched: 2026-05-18*
