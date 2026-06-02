# 06-03 Summary

- Added `electron-builder` to the desktop workspace.
- Added packaging scripts:
  - `dist:dir`
  - `dist:win`
- Added release-oriented builder metadata to `apps/desktop/package.json`.
- Disabled `signAndEditExecutable` for this environment so unpacked Windows packaging does not fail on the `winCodeSign` symlink extraction path.
- Moved package output to `release-artifacts/` to avoid a stale lock on the old `release/` directory.

Verification:
- `pnpm install`
- `pnpm --filter @floirsmnh/desktop dist:dir`
- verified unpacked artifact path:
  - `D:\clwd\FloirsMNH\apps\desktop\release-artifacts\win-unpacked\FloirsMNH.exe`

Notes:
- `dist:win` is configured but was not executed here after `dist:dir` succeeded.
