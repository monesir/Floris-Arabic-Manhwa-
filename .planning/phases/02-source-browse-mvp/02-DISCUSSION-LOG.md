# Phase 2 Discussion Log

## 2026-05-18

### Context carried forward from Phase 1
- Source adapters must conform to the shared contract and capability-flag model.
- Built-in sources are the active runtime path for Phase 2.
- External plugin execution remains deferred.

### Live source findings
- Azora exposes readable and locked chapters through the same general title/chapter hierarchy, so chapter availability cannot be assumed.
- Olympus exposes strong title metadata and chapter-list structures on title pages, but support/payment language exists in the product surface and must not be confused with readable content support.

### Locked assumptions for planning
- Phase 2 will treat readable public chapters as supported content.
- Locked/login-required chapters will be surfaced as locked states, not bypassed.
- Search will be source-scoped, not global.
