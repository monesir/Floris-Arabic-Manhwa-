# Phase 5 Context: Offline and Analytics

## Phase Goal

Extend the now-functional reader into a durable local product by adding offline downloads, local imports, reading history, and per-title time analytics.

## Starting Point

Phase 4 completed the reader loop:
- the app can open real chapters in a dedicated reader route
- reading progress persists by source/title/chapter position
- `Read` and `Continue` launch from title details

Current gaps relative to Phase 5:
- no persistent download queue exists
- the Downloads route is still a placeholder
- no import pipeline exists for folders, `CBZ`, or `PDF`
- no reading history exists
- no reading-session timing or per-title aggregate time exists
- no settings-facing analytics surface exists

## Locked Decisions Carried Forward

- the app stays local-first with no account or cloud dependency
- the app is Windows-first
- source/network logic stays outside the renderer behind preload/IPC
- local persistence remains SQLite-backed
- reader progress already persists by `source_id + source_title_id`
- download destination support must include both app-managed storage and optional external folders

## Product Intent For Phase 5

The user should be able to save chapters for offline reading, inspect queue state, import local content into the same library model, and see what they have actually read over time.

## Working Assumptions For Planning

- `05-01` should focus on app-managed downloads first, because it is the smallest complete offline slice
- `05-02` should add destination controls, retry, and failure handling on top of the job model from `05-01`
- imported local content can be modeled as library entries with a local-source identity instead of inventing a second library system
- history and time analytics should consume the reader activity path that now exists instead of creating a disconnected tracker

## Risk Areas

- remote image URLs can expire or block automated fetching differently from on-screen reading
- CBZ/PDF import broadens the file-format surface and can consume more implementation time than simple chapter-folder import
- analytics can become noisy if session timing is not tied cleanly to reader open/close semantics

## Recommended Execution Split

- `05-01`: implement download jobs, app-managed storage, queue UI, and title/chapter enqueue actions
- `05-02`: add external destination selection, retry, and stronger failure handling
- `05-03`: implement local import normalization for folders, `CBZ`, and `PDF`
- `05-04`: add reading history, session timing, and per-title analytics surfaces
