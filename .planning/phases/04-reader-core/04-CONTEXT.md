# Phase 4 Context: Reader Core

## Phase Goal

Turn the current browse-first application into an actual reading product by adding a dedicated reader route, real chapter rendering, viewing modes, and durable resume behavior.

## Starting Point

Phase 3 completed the collection workflow:
- source browse and title details are real
- chapter lists already exist in normalized source adapters
- chapter page fetching already exists through `sources:get-chapter-pages`
- library entries, custom lists, and update tracking are persisted locally

Current gaps relative to Phase 4:
- there is no dedicated reader route
- title details cannot launch into a chapter reader yet
- no reader settings panel exists
- no reading mode controls exist
- no persisted chapter/page progress exists
- `Continue` behavior is not wired anywhere

## Locked Decisions Carried Forward

- Electron plus safe preload/IPC boundaries remain mandatory
- all source fetching stays outside the renderer
- the app remains local-first and Windows-first
- the reader must support:
  - vertical
  - horizontal paged
  - RTL
  - long-strip webtoon
- the reader must use a side settings panel
- progress must persist automatically by title/chapter/position
- the title details surface is the primary entry point for `Read` and `Continue`

## Product Intent For Phase 4

The user should be able to open a saved or browsed title, start reading from a chosen chapter, switch reading modes without leaving the chapter, and later resume from the correct place after closing and reopening the app.

## Working Assumptions For Planning

- progress should be keyed by `source_id + source_title_id`, with optional `library_entry_id` linkage
- global reader preferences are enough for this phase; advanced per-title or per-source presets remain deferred
- first-time `Read` should start from the oldest readable chapter when a title has readable chapters
- `Continue` should prefer persisted progress and fall back to the default readable chapter
- chapter navigation inside the reader should understand both older and newer chapter movement based on the normalized chapter list

## Risk Areas

- source chapter page markup can drift independently from title/chapter list markup
- vertical/webtoon scroll restoration can become brittle if persisted state is too coarse
- the current source detail flow lives inside `BrowseWorkspace`, so reader launch wiring must not collapse that route into tangled state

## Recommended Execution Split

- `04-01`: add the reader route, reader data bridge, chapter loading, and side settings panel
- `04-02`: implement reading modes, page/chapter navigation, and zoom/fit controls
- `04-03`: persist progress and wire `Read`/`Continue` from title details into the reader
