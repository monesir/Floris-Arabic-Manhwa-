# 01-03 Summary

## Outcome

Plan `01-03` is complete. Phase 1 now has a real plugin and source contract skeleton plus a real Plugins page backed by registry state.

Implemented:
- shared source contracts for metadata, capability flags, title details, chapter lists, chapter pages, and derived title actions
- strict external plugin manifest validation with stable `plugin_id` and `source_id`
- built-in plugin runtime registration aligned with the same contract family
- external plugin discovery from the app user-data `plugins` directory
- real Plugins page state through preload/IPC instead of static placeholder JSX

## Key Decisions Realized

- Title-level actions are derived from capability flags instead of a separate action contract.
- Built-in plugins execute through the runtime path, while external plugins are discovered and validated but not treated as active source runtimes yet.
- The Plugins page now reads persisted registry state and exposes validation failures to the user.

## Verification

Passed:
- `pnpm typecheck`
- `pnpm build`
- smoke runtime launch with:
  - `FLOIRSMNH_SMOKE_EXIT_MS=1500`
  - `pnpm exec electron .`
- registry inspection after normal smoke launch confirmed:
  - built-in plugin `core.builtin` in `ready` state
  - built-in source `core.placeholder`
- temporary invalid external plugin verification:
  - created `plugin.json` with invalid manifest content under the app plugin directory
  - smoke-launched the app
  - confirmed `external.invalid-sample` was written as `invalid` with a visible failure reason
  - removed the temporary invalid plugin and smoke-launched again to restore a clean registry

## Notes

- External plugin discovery currently expects plugin folders under the app user-data `plugins` directory with a root `plugin.json`.
- The page and service surface are intentionally registry-first in Phase 1; real external runtime execution remains deferred to later hardening work.
