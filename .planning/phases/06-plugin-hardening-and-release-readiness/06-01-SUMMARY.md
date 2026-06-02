# 06-01 Summary

- Expanded plugin contracts and persistence to store runtime mode, compatibility state, entry-file details, plugin paths, and loaded-source counts.
- Added bounded external runtime loading through manifest-declared `entry_file` modules that export `sourceHandlers`.
- Restricted runtime entry resolution to paths inside the plugin root.
- Added BOM-tolerant manifest parsing so common PowerShell-authored `plugin.json` files do not fail incorrectly.
- Preserved invalid external plugins in the registry instead of deleting them simply because they have no active sources.
- Extended the active source catalog so runtime-ready external sources can join built-in sources through the existing IPC path.

Verification:
- `node_modules\.bin\tsc.CMD --noEmit`
- `pnpm dlx tsx` bootstrap test against a temp user-data directory
- verified results included:
  - one `invalid` plugin with explicit missing-entry diagnostic
  - one `ready` external runtime plugin
  - one active external source in the source catalog
