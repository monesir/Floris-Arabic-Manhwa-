# 02-03 Summary

## Outcome

Plan `02-03` is complete. Titles discovered in browse/details can now be saved into the persistent local library model, and the `Library` route renders a real minimal collection from SQLite instead of a conceptual placeholder.

Implemented:
- real library write path built on `library_entry_id`, `source_id`, and `source_title_id`
- main-process library service plus preload/IPC channels for add/list operations
- add-to-library action inside browse title details with saved-state feedback
- minimal library page showing persisted entries with source identity and stored title metadata

## Key Decisions Realized

- The existing `library_entries` schema remains the source of truth instead of widening the data model prematurely for cover-first polish.
- Library writes are idempotent per `(source_id, source_title_id)` and update title metadata without creating duplicates.
- Phase 2 closes only after discovered titles can cross the boundary from source browsing into app-owned persistence.

## Verification

Passed:
- `pnpm typecheck`
- `pnpm build`
- smoke launch via `pnpm --filter @floirsmnh/desktop exec electron .` with `FLOIRSMNH_SMOKE_EXIT_MS=1500`
- direct persistence verification via `pnpm dlx tsx` against the real local database at `C:\Users\mjeed\AppData\Roaming\@floirsmnh\desktop\floirsmnh.db`

Validated behaviors:
- adding `The Oracle of the Villainous Baby` created a stable `library_entry_id`
- listing library entries returned the persisted saved title from the same database

## Notes

- Verification inserted one real library entry into the local application database. That is consistent with the feature path and gives the current Library screen something real to render.
