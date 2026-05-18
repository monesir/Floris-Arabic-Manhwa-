# Phase 5 Research

## Current Codebase Constraints

- the Downloads and History routes are still placeholders
- source adapters already return per-page image URLs through `getChapterPages`
- the reader route and persisted progress now create a natural anchor for history and time tracking
- there is no existing file dialog or local import helper layer yet

## Schema Direction

Phase 5 likely needs:
- `download_jobs`
- `download_job_files` or equivalent per-asset manifest
- `reading_history`
- `reading_sessions`
- import-oriented local metadata tables or a local-source strategy backed by `library_entries`

## Implementation Direction

- keep download execution in the main/services layer, not in the renderer
- prefer additive queue state persisted in SQLite rather than in-memory job tracking only
- treat app-managed download storage as the first complete vertical slice before adding external destinations
