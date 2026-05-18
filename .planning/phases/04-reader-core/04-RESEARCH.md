# Phase 4 Research

## Current Codebase Constraints

- source adapters already expose `getChapterPages`, so Phase 4 does not need a new remote contract
- current title details live inside `BrowseWorkspace` rather than a dedicated route
- `library_entries` stores organization data but no reading progress
- `app_settings` can already persist simple global values through `SettingsRepository`

## Schema Direction

Phase 4 likely needs:
- a `reading_progress` table keyed by `source_id + source_title_id`
- persisted fields for:
  - `library_entry_id`
  - `last_read_chapter_id`
  - `last_read_page_index`
  - `last_read_scroll_progress`
  - timestamps
- reader preference keys for:
  - mode
  - fit mode
  - zoom level

## Implementation Direction

- keep source loading in the main process and expose reader state through preload/IPC
- keep renderer logic responsible for view state, while persistence and progress semantics stay in services/repositories
- prefer additive routing with a dedicated `/reader` route instead of mutating the browse route into a pseudo-reader
