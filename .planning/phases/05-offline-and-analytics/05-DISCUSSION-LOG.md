# Phase 5 Discussion Log

## Inputs Used

- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- current reader, library, and source implementation in `apps/desktop/src`

## What Was Resolved From Existing Context

- the next vertical slice should start with downloads, not imports or analytics
- app-managed download storage is the safest first offline target
- the current source adapters already expose `chapter_pages`, which is enough to materialize image assets locally
- reading history and time analytics should build on the live reader path instead of a separate manual tracker

## Assumptions Chosen To Avoid Blocking

- built-in sources can support download queueing even though `downloads` capability was not surfaced earlier
- first download jobs will target readable chapters only
- imported local content can be introduced later without blocking the download architecture

## Open Matters Deferred To Later Plans

- exact external destination UX
- exact import path validation rules for malformed CBZ/PDF inputs
- whether analytics should live in Settings only or also in History
