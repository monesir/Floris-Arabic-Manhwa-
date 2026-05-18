# Walking Skeleton - FloirsMNH

**Phase:** 1
**Generated:** 2026-05-18

## Capability Proven End-to-End

A user can launch the desktop app, navigate the full shell, change a persisted language setting, and see built-in plus externally discovered plugin records reflected through the app's local persistence and safe Electron boundaries.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Electron + React + TypeScript desktop app | Matches the chosen desktop model and the Houdoku-like product direction |
| Data layer | Local SQLite-backed persistence spine | Stronger durability than browser-only storage and aligned with later tracking/download needs |
| Plugin model | Built-in runtime plus external discovery/validation | Proves the plugin architecture without overcommitting Phase 1 to full external execution |
| Shell structure | Small monorepo with `apps/desktop` | Supports future growth without premature package splitting |
| Directory layout | Strict modular structure with feature-first renderer | Reduces early reorganization and keeps domain boundaries clear |

## Stack Touched in Phase 1

- [ ] Project scaffold (workspace, desktop app, build, lint, run path)
- [ ] Routing - at least one real route plus the shell navigation map
- [ ] Database - at least one real read AND one real write for settings/plugin registry state
- [ ] UI - at least one interactive element wired through persistence
- [ ] Deployment - documented local full-stack run command for the desktop app

## Out of Scope (Deferred to Later Slices)

- Real source browsing behavior
- Reader implementation
- Download runtime
- Rich title page behavior
- Full external plugin execution
- Plugin authoring skill/docs

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: Online source browse/search/title details through the source contract
- Phase 3: Library organization, updates surface, and title management
- Phase 4: Reader flow and progress persistence
- Phase 5: Downloads, imports, and analytics
- Phase 6: External plugin hardening and release readiness
