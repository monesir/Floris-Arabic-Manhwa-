# 03-03 Summary

## Outcome

Plan `03-03` is complete. Saved library titles can now participate in tracked update detection, show visible new-chapter indicators in the library, and feed a real `Updates` route instead of a placeholder.

Implemented:
- `library_entry_updates` persistence for baseline latest-chapter state, detected latest chapter metadata, pending update count, and refresh timestamps
- library refresh service that compares current source chapter lists against saved known state per library entry
- IPC/preload methods for `refresh` and `list updates`
- library-card badges showing pending update counts
- a real `Updates` page with refresh control and tracked chapter-change rows

## Key Decisions Realized

- Update detection is stored separately from `library_entries`, preserving the library identity model while keeping refresh state durable.
- First refresh initializes a baseline instead of marking the whole source history as unread updates.
- Detected updates do not immediately overwrite the known baseline; this keeps the indicator visible until a later acknowledgement/reset path exists.

## Verification

Passed:
- `node_modules/.bin/tsc.CMD --noEmit`
- `node_modules/.bin/electron-vite.CMD build`
- smoke launch via `node_modules/.bin/electron.CMD .` with `FLOIRSMNH_SMOKE_EXIT_MS=1500`

Validated behaviors:
- update detection contracts compile across repository, service, IPC, preload, and renderer layers
- library entries now surface `pendingUpdateCount` and latest detected chapter metadata
- `Updates` is no longer a placeholder route

## Notes

- As with earlier Phase 3 work, verification relied on direct `.bin` commands because `pnpm` is not available on the active shell PATH.
- The next natural extension is a future acknowledgement path that clears or advances the known-latest baseline when reading/progress features arrive in Phase 4.
