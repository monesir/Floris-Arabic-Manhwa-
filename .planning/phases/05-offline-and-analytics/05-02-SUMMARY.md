# 05-02 Summary

## Outcome

The download system now supports external destination preference selection and retrying failed jobs from the real Downloads route.

## What Changed

- extended download settings through app-level persistence keys for destination mode and external path
- added Electron directory-picker IPC for external download folders
- updated download enqueue behavior to respect app-managed versus external destination preference
- added retry support for failed download jobs
- expanded the Downloads page with destination controls and retry actions

## Verification

- `node_modules/.bin/tsc.CMD --noEmit`
- `node_modules/.bin/electron-vite.CMD build`
- smoke launch via `node_modules/.bin/electron.CMD .`

## Notes

- the settings keys exist only after the user changes destination mode or chooses an external folder
- import workflows and reading analytics remain for `05-03` and `05-04`
