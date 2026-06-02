# 06-02 Summary

- Reworked the Plugins route into a live diagnostics surface instead of static summary cards.
- Added `Rescan plugins` support through preload/IPC and the plugin bootstrap path.
- Added visibility for:
  - compatibility status
  - runtime mode
  - loaded-source count
  - manifest path
  - entry-file path
  - compatibility reason
  - failure reason
- Extended plugin source rows to show language and base URL metadata.

Verification:
- `node_modules\.bin\tsc.CMD --noEmit`
- `node_modules\.bin\electron-vite.CMD build`
