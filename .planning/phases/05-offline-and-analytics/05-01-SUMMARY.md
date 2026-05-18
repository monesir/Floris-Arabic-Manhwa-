# 05-01 Summary

## Outcome

The Downloads route is no longer a placeholder. The app now has a persistent chapter-download queue backed by SQLite and app-managed storage under the Electron user-data directory.

## What Changed

- added download contracts in `apps/desktop/src/shared/contracts/downloads.ts`
- added `download_jobs` schema plus `DownloadJobRepository`
- added `download-service` with app-managed storage and serialized queue processing
- added downloads IPC/preload bridge
- replaced `DownloadsPage` placeholder with a real queue view
- added chapter-level `Download` enqueue actions inside title details in `BrowseWorkspace`
- aligned built-in source capabilities so `downloads` is now true for supported sources

## Verification

- `node_modules/.bin/tsc.CMD --noEmit`
- `node_modules/.bin/electron-vite.CMD build`
- smoke launch via `node_modules/.bin/electron.CMD .`
- direct SQLite check confirmed `download_jobs` exists in `C:\Users\mjeed\AppData\Roaming\@floirsmnh\desktop\floirsmnh.db`

## Notes

- this plan covers app-managed storage only
- external destination selection and retry handling remain for `05-02`
