# Phase 3 Context: Library Workflow

## Phase Goal

Turn the current minimal saved-entry collection into a real library workflow with organization, status management, favorites, custom lists, and visible update indicators.

## Starting Point

Phase 2 proved the cross-boundary flow from live source discovery into local persistence:
- built-in sources are live through normalized IPC-backed adapters
- browse and title details are real
- `library_entries` persists saved titles with `library_entry_id`, `source_id`, `source_title_id`, `title_name`, and `source_title_slug`
- the Library route is real but intentionally minimal

Current gaps relative to Phase 3:
- no reading status model
- no favorites
- no search/sort/filter controls in the library
- no custom lists
- no update detection or `Updates` view behavior
- no cover snapshot persisted in the library model, so the current library cannot be truly cover-first yet

## Locked Decisions Carried Forward

- Windows-first Electron app
- `pnpm` workspace with `apps/desktop`
- `node:sqlite` local persistence path remains in place for now
- source fetching stays outside the renderer
- built-in source adapters are live; external plugin runtime execution is still deferred
- the identity model remains:
  - library-owned `library_entry_id`
  - source identity via `source_id + source_title_id`
  - chapter identity via source chapter IDs or stable URL-derived fallback

## Phase 3 Product Intent

The user should be able to treat the app as an actual personal collection, not merely a browse client:
- organize titles by status and favorites
- search and filter the collection
- group titles into custom lists
- see which saved titles have new chapters
- open an `Updates` surface focused on tracked library changes

## Working Assumptions For Planning

- reading statuses will use a standard explicit set:
  - `reading`
  - `completed`
  - `on_hold`
  - `dropped`
  - `plan_to_read`
- favorites will be a boolean library-owned flag
- custom lists should be library-owned entities, not source-owned metadata
- update detection should use source refresh against saved library entries and persist minimal comparison state locally
- the library will need enough persisted metadata to render cover-first cards without re-fetching everything synchronously on every page load

## Risk Areas

- the current `library_entries` schema is too small for Phase 3 UX and will need migration-safe expansion
- update detection depends on live source parsing, so parser drift can affect update accuracy
- `node:sqlite` remains experimentally flagged upstream and should not be over-coupled to brittle migration patterns

## Recommended Execution Split

- `03-01`: expand library persistence and turn the Library route into a real searchable/sortable/filterable cover-first collection with statuses and favorites
- `03-02`: add custom lists and list membership management
- `03-03`: add source refresh/update detection and wire the `Updates` view plus visible library cover badges
