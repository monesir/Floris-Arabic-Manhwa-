# 03-01 Summary

## Outcome

Plan `03-01` is complete. The Library route is no longer a minimal persistence proof; it is now a real cover-first collection surface with status management, favorites, search, sorting, and filtering backed by SQLite.

Implemented:
- migration-safe expansion of `library_entries` with `cover_url`, `reading_status`, and `is_favorite`
- richer library repository queries plus mutation paths for status and favorite changes
- preload/IPC wiring for filtered library reads and per-entry organization updates
- browse-to-library persistence now carries source cover URLs into the saved model
- a real Library UI with cover cards, search, status filter, sort selection, favorite-only filtering, and in-place status/favorite controls
- safer plugin/source bootstrap cleanup so startup no longer breaks when persisted library entries reference existing sources

## Key Decisions Realized

- Phase 3 keeps the existing library identity model and extends it instead of replacing it.
- Reading state remains library-owned rather than derived from source metadata.
- Cover-first rendering is supported by persisted `cover_url`, avoiding synchronous re-fetch requirements just to paint the library.
- Registry cleanup is now constrained by library foreign-key ownership, so source/plugin bootstrap does not delete referenced rows blindly.

## Verification

Passed:
- `node_modules/.bin/tsc.CMD --noEmit`
- `node_modules/.bin/electron-vite.CMD build`
- smoke launch via `node_modules/.bin/electron.CMD .` with `FLOIRSMNH_SMOKE_EXIT_MS=1500`

Validated behaviors:
- the expanded library schema builds and loads without breaking existing Phase 2 entries
- library filters and mutations compile across repository, IPC, preload, and renderer boundaries
- Electron startup succeeds after replacing destructive plugin/source cleanup with unreferenced-only cleanup

## Notes

- Verification was executed directly through local `.bin` commands because `pnpm` is not available on this shell path even though the workspace is configured for `pnpm`.
- A direct out-of-process read of the app database under `AppData\\Roaming` was not available from this sandbox, so persistence validation here relied on successful runtime startup and the compiled data path.
