# Stack Research

**Domain:** Windows-first desktop manhwa reader and library manager
**Researched:** 2026-05-18
**Confidence:** MEDIUM

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Electron | 42.1.0 | Desktop shell, native integration, packaging | Required by project direction and aligned with the Houdoku reference architecture. |
| React | 19.2.6 | Renderer UI layer | Strong desktop-web ergonomics, mature component ecosystem, and fits a sidebar-heavy reader app well. |
| TypeScript | 6.0.3 | Type-safe application code | Important for plugin contracts, IPC boundaries, parser results, and long-lived maintainability. |
| Vite | 8.0.13 | Fast renderer build pipeline | Good developer iteration speed and a straightforward fit for React-based Electron renderers. |
| SQLite via `better-sqlite3` | 12.10.0 | Local-first persistence for library, progress, downloads, history, and analytics | A publishable local desktop app with tracking and offline features is better served by a real embedded database than `localStorage`. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `electron-builder` | 26.8.1 | Windows packaging and distribution | Use for signed installers, app metadata, icons, and release artifacts. |
| `electron-vite` | 5.0.0 | Electron-oriented Vite integration | Use if the repo chooses the opinionated Electron plus Vite toolchain instead of wiring Electron manually. |
| `zustand` | 5.0.13 | Lightweight client state for UI/session state | Use for renderer-side UI state such as active filters, reader controls, and download panels. |
| `@tanstack/react-query` | 5.100.10 | Async state/cache for source fetch flows | Use for browse/search/update flows where caching, retries, and background refresh help. |
| `drizzle-orm` | 0.45.2 | Typed SQLite schema/query layer | Use if the project wants safer schema management and cleaner persistence boundaries over handwritten SQL. |
| `zod` | 4.4.3 | Runtime validation | Use for plugin manifests, source adapter outputs, IPC payloads, and imported metadata. |
| `playwright` | 1.60.0 | End-to-end testing | Use for renderer/UI verification, not as the default content-source extraction strategy. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Electron Forge | Official Electron tooling | Good official baseline if the project prefers the Electron-maintained flow over custom wiring. |
| Playwright | E2E coverage for desktop UI flows | Focus on smoke tests around source browse, add-to-library, reader resume, and downloads. |
| ESLint/Biome/Prettier class tooling | Static quality | Keep plugin API and IPC code strictly linted because mistakes there fan out quickly. |

## Installation

```bash
# Core
npm install electron react react-dom typescript vite better-sqlite3

# Supporting
npm install zustand @tanstack/react-query drizzle-orm zod

# Dev dependencies
npm install -D electron-builder electron-vite playwright
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Electron | Tauri | Use Tauri only if startup size and memory footprint become a higher priority than ecosystem familiarity and Houdoku-like architecture. |
| SQLite | `localStorage` / JSON files | Acceptable only for throwaway prototypes; not suitable once library analytics, downloads, and plugin state become first-class product features. |
| React + Zustand | Heavy global frameworks | Use a heavier solution only if the app evolves into a much more workflow-dense desktop suite. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `localStorage` as the primary data store | Fragile for richer library state, migrations, analytics, and publishable durability | SQLite with a clear repository layer |
| Direct renderer access to Node/Electron APIs | Increases security risk and weakens process boundaries | Preload APIs with `contextBridge` and narrow IPC contracts |
| Browser automation as the default source engine | Heavy, brittle, and expensive for routine source listing/chapter parsing | Structured HTTP/HTML parsing first, with browser automation only as fallback |

## Stack Patterns by Variant

**If source scraping remains mostly static HTML:**
- Use HTTP fetching plus HTML parsing adapters
- Because it keeps sources faster, simpler, and easier to sandbox

**If a source becomes highly script-driven or anti-bot sensitive:**
- Isolate the source in a dedicated worker or utility process
- Because failures and heavier parsing should not destabilize the UI process

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `electron@42.1.0` | `react@19.2.6` | Standard renderer integration pattern; keep main/preload separation explicit. |
| `vite@8.0.13` | `typescript@6.0.3` | Good fit for modern TS-based renderer builds. |
| `better-sqlite3@12.10.0` | `drizzle-orm@0.45.2` | Strong local persistence pairing if typed schema management is desired. |

## Sources

- [Electron Docs](https://www.electronjs.org/docs/latest/) - current official Electron guidance and tooling references
- [Electron Process Model](https://www.electronjs.org/docs/latest/tutorial/process-model) - verified main/renderer/preload boundaries and utility-process guidance
- [Houdoku README](https://github.com/xgi/houdoku) - reference app stack and plugin/content-source model
- `npm view` package metadata on 2026-05-18 - current package versions for recommended stack elements

---
*Stack research for: Windows-first desktop manhwa reader and library manager*
*Researched: 2026-05-18*
