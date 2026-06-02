# Phase 6 Context: Plugin Hardening and Release Readiness

## Phase Goal

Finish the product by hardening external plugin support and adding a real Windows packaging path suitable for distribution testing.

## Starting Point

Phase 5 completed the functional reader, downloads, imports, and analytics loop:
- the app can browse real sources, save titles, read chapters, download content, and import local material
- built-in plugins already back the active source runtime
- external plugins are discovered from the user-data `plugins` directory and validated only at the manifest level
- the Plugins route is real, but external runtime execution is still deferred
- no release packaging configuration exists yet

## Locked Decisions Carried Forward

- the app remains local-first with no account or cloud dependency
- Electron remains the desktop shell and Windows remains the target platform
- source/network/runtime logic stays out of the renderer behind preload/IPC
- external plugins should be supported, but with explicit runtime bounds and understandable diagnostics
- the product should stay close to Houdoku functionally, while keeping our stricter persistence model

## Product Intent For Phase 6

The user should be able to drop a plugin into the plugins directory, understand whether it is compatible and loadable, and avoid silent crashes or ambiguous failure states. The codebase should also be able to produce a Windows-oriented packaged build path rather than a development-only shell.

## Working Assumptions For Planning

- `06-01` should extend the manifest contract and introduce bounded runtime loading for trusted local plugins
- external runtime loading should stay constrained to source handlers declared in the manifest instead of exposing arbitrary renderer privileges
- `06-02` should turn the Plugins route into the primary diagnostics surface for compatibility, entry-file state, runtime mode, and rescan feedback
- `06-03` should add an installer-oriented Windows build path plus a lighter unpacked verification target

## Risk Areas

- loading arbitrary JavaScript in the main-process environment is inherently sensitive, so the phase should define clear trust limits and path bounds instead of pretending to offer full sandboxing
- source plugins can drift independently of the app and need compatibility reporting that is more precise than simple valid/invalid status
- Electron packaging can surface issues with `node:sqlite`, resource inclusion, or output paths that were invisible during `electron-vite build`

## Recommended Execution Split

- `06-01`: implement manifest compatibility checks, path-bounded entry loading, and external runtime registration
- `06-02`: improve plugin diagnostics UI, rescan behavior, and compatibility reporting
- `06-03`: add Windows packaging scripts/config and verify a release-oriented artifact path
