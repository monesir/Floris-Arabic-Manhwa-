# Phase 1: Foundation Shell - Research

**Researched:** 2026-05-18
**Domain:** Electron desktop shell, local-first persistence, plugin-aware app foundation
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Strict modular structure from day one
- Small monorepo with `apps/desktop`
- Feature-first renderer structure
- Shared internal contracts for sources/plugins
- Real local persistence spine with minimal real schema
- Built-in plugin runtime support plus external plugin discovery/validation
- Real shell with full navigation map, smart placeholders, and real settings persistence/language switching
- Language switching must support Arabic text correctly while keeping overall layout stable
- Source contract must be contract-first with explicit capability flags

### the agent's Discretion
- Exact package manager, task runner, and workspace wiring
- Exact SQLite access layer and migration tooling choice
- Exact placeholder copy and shell polish level

### Deferred Ideas (OUT OF SCOPE)
- Full source browsing implementation
- Reader behavior
- Download manager runtime
- Developer-facing plugin-authoring skill/docs
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| App shell and routing | Browser/Client | Frontend Server | Renderer owns navigation and UI composition |
| Native window/app lifecycle | Frontend Server | - | Electron main process owns privileged desktop lifecycle |
| Settings persistence | Database/Storage | Browser/Client | Storage is local-first, UI consumes persisted values |
| Plugin discovery and validation | Frontend Server | Database/Storage | Main/preload boundary should own filesystem/plugin entry |
| Built-in source contract runtime | Browser/Client | Frontend Server | Renderer/service layer can model built-in runtime while privileged access stays bounded |
</architectural_responsibility_map>

<research_summary>
## Summary

Phase 1 should prove the smallest real full-stack desktop slice for FloirsMNH: the user launches the Electron app, sees the full shell, changes a setting such as language, the app persists that change locally, and the Plugins page reflects built-in/external plugin state through a validated contract boundary. This is a more valuable walking skeleton than a pure scaffold because it exercises renderer UI, preload/main boundaries, local persistence, and the plugin/source model that later phases will depend on.

The standard Electron guidance remains to keep the renderer isolated from direct Node access and expose only narrow preload APIs. For this project, that guidance matters more than usual because plugin discovery and future downloads will touch the filesystem. The other architectural recommendation is to use a real local database-backed model now rather than follow Houdoku's lighter `localStorage` approach; this project has stricter durability needs because it intends to grow into library tracking, analytics, downloads, and plugin registries.

**Primary recommendation:** Build Phase 1 as a walking skeleton that proves `renderer shell -> preload API -> local persistence -> renderer readback` plus a built-in plugin registry surface.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Electron | 42.1.0 | Desktop shell and native boundaries | Official fit for the chosen app model and the reference product |
| React | 19.2.6 | Renderer UI | Strong ecosystem for desktop-style app composition |
| TypeScript | 6.0.3 | Typed contracts and maintainability | Important for IPC, plugin manifests, and source contracts |
| SQLite via `better-sqlite3` | 12.10.0 | Durable local data layer | Better suited than browser-only storage for local-first desktop state |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `electron-vite` | 5.0.0 | App scaffold and dev build flow | Use if the project wants a direct Electron+Vite baseline |
| `zod` | 4.4.3 | Runtime validation | Use for plugin manifests and contract payload checks |
| `drizzle-orm` | 0.45.2 | Schema/query layer | Use if typed schema management is preferred over handwritten SQL |
| `zustand` | 5.0.13 | Lightweight UI state | Useful for shell/session state without heavy ceremony |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SQLite | `localStorage` | Faster prototype, weaker durability and schema evolution |
| App-internal contract modules | Early extracted packages | Cleaner package boundaries later, but premature split now |

**Installation:**
```bash
npm install electron react react-dom typescript vite better-sqlite3 zod
npm install -D electron-vite
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### System Architecture Diagram

```text
User launches app
    ↓
Electron main process
    ↓
Preload bridge exposes safe APIs
    ↓
Renderer shell loads routes/providers
    ↓
Settings / Plugins pages call services
    ↓
Persistence + plugin registry update locally
    ↓
Renderer re-reads state and reflects it
```

### Recommended Project Structure
```text
apps/
`-- desktop/
    `-- src/
        |-- main/
        |-- preload/
        |-- renderer/
        |   |-- app/
        |   |-- pages/
        |   |-- features/
        |   `-- shared/
        |-- services/
        |-- db/
        |-- plugins/
        `-- shared/
```

### Pattern 1: Narrow Preload Gateway
**What:** Renderer consumes a small typed API instead of direct Node/Electron access.
**When to use:** Always for settings persistence, plugin discovery, filesystem paths, and native shell concerns.
**Example:**
```typescript
// preload exposes a typed settings API only
contextBridge.exposeInMainWorld("appSettings", {
  get: () => ipcRenderer.invoke("settings:get"),
  setLanguage: (language: string) => ipcRenderer.invoke("settings:set-language", language),
});
```

### Pattern 2: Registry + Runtime Split
**What:** Plugin/source metadata registry is separate from executable runtime behavior.
**When to use:** Especially when built-in plugins execute first while external plugins are discovered/validated only.
**Example:**
```typescript
type PluginRecord = {
  pluginId: string;
  version: string;
  sourceIds: string[];
  status: "built-in" | "validated" | "invalid";
};
```

### Anti-Patterns to Avoid
- **Renderer-owned filesystem/plugin discovery:** violates Electron boundary discipline and complicates hardening.
- **Future-table over-modeling:** adds schema debt before the product proves its first shell behavior.
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Arbitrary manifest parsing | Ad hoc JSON shape checks | `zod` or equivalent runtime schema validation | Clearer diagnostics and safer plugin handling |
| Browser-only settings storage | Custom localStorage wrappers as the source of truth | Real local persistence boundary | Avoids later migration pain |
| Direct custom Electron bundling from scratch | Over-customized initial build stack | Electron+Vite baseline | Faster to reach a working skeleton |

**Key insight:** Phase 1 should hand-roll product structure, not commodity tooling problems.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Treating scaffold as sufficient
**What goes wrong:** The phase ends with folders and configs but no proven user-visible capability.
**Why it happens:** Teams mistake build success for a working skeleton.
**How to avoid:** Require one real persisted settings flow and one real plugin status flow.
**Warning signs:** No read/write round-trip visible in the UI.

### Pitfall 2: Letting plugin concerns explode too early
**What goes wrong:** Phase 1 becomes an ecosystem project instead of a shell foundation.
**Why it happens:** Plugin ambition outpaces phase scope.
**How to avoid:** Keep built-in runtime real, keep external runtime non-executing for now.
**Warning signs:** Planning starts including external source execution stories.

### Pitfall 3: Following Houdoku's storage model too literally
**What goes wrong:** The app inherits weak persistence boundaries that do not fit future analytics/download goals.
**Why it happens:** Reference-product mimicry overrides product-specific durability needs.
**How to avoid:** Preserve Houdoku's shell lessons but use a stronger local data model.
**Warning signs:** Phase 1 falls back to `localStorage` as the long-term system of record.
</common_pitfalls>

<open_questions>
## Open Questions

1. **SQLite access layer**
   - What we know: The project wants a real local persistence spine.
   - What's unclear: Whether raw SQL or a typed ORM/migration layer will provide the best long-term fit.
   - Recommendation: Decide during planning based on smallest viable operational complexity.

2. **Built-in plugin packaging shape**
   - What we know: Built-ins should execute through the core runtime in Phase 1.
   - What's unclear: Whether built-ins should be represented as code-only registrations or loaded through the exact same manifest shape as externals.
   - Recommendation: Prefer one manifest shape if it does not add significant friction.
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- [Electron Docs](https://www.electronjs.org/docs/latest/) - current Electron guidance
- [Electron Process Model](https://www.electronjs.org/docs/latest/tutorial/process-model) - main/preload/renderer boundary model

### Secondary (MEDIUM confidence)
- [Houdoku README](https://github.com/xgi/houdoku) - reference architecture and plugin model
- [Houdoku Getting Started](https://houdoku.org/guides/getting-started.html) - shell, settings, downloads, and plugin usage patterns
- [Houdoku Adding from Websites](https://houdoku.org/guides/adding-content/websites.html) - plugin-driven source installation flow

### Tertiary (LOW confidence - needs validation)
- User-supplied Houdoku title-page screenshot - informs page composition and title-action expectations
</sources>
