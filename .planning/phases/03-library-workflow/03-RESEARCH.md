# Phase 3 Research

## Current Codebase Constraints

- `library_entries` currently stores only identity plus name/slug
- `BrowseWorkspace` already knows enough normalized title metadata to enrich library persistence on add/save paths
- source adapters expose chapter lists, which is sufficient to support later update comparison without adding new remote contracts first
- the `Updates` route is still a placeholder and can be repurposed cleanly in this phase

## Schema Direction

Phase 3 likely needs at least:
- extra fields on `library_entries` for UI and organization:
  - `cover_url`
  - `status`
  - `favorite`
  - `last_known_chapter_id`
  - `last_known_chapter_label`
  - timestamps related to source refresh
- new tables for custom lists and memberships
- possibly a lightweight `library_updates` table or equivalent derived state for surfaced changes

## Implementation Direction

- prefer additive migrations over replacing the Phase 2 schema
- prefer renderer views built on repository-backed IPC read models rather than pushing SQL shape into the renderer
- keep custom lists separate from statuses; they serve different organization jobs
