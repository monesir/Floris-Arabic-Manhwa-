# Pitfalls Research

**Domain:** Windows-first desktop manhwa reader and library manager
**Researched:** 2026-05-18
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Coupling source parsing to UI pages

**What goes wrong:**
Every source change breaks screens directly, making simple site updates look like app-wide regressions.

**Why it happens:**
Teams prototype quickly with fetch logic embedded in browse/detail components and never pull it back out.

**How to avoid:**
Define a normalized source contract early and isolate source adapters behind services/plugins.

**Warning signs:**
Page components contain HTML parsing, source-specific selectors, or source-specific download rules.

**Phase to address:**
Phase 1 and Phase 2

---

### Pitfall 2: Using weak persistence for core reading state

**What goes wrong:**
Progress, download queues, and analytics become unreliable after restart or schema changes.

**Why it happens:**
`localStorage` or ad hoc JSON files feel sufficient in early prototypes.

**How to avoid:**
Adopt a proper local persistence layer from the start for library, progress, downloads, and history.

**Warning signs:**
No migration plan, no durable queue model, and no stable IDs for titles/chapters.

**Phase to address:**
Phase 1

---

### Pitfall 3: Making the plugin system too dynamic too early

**What goes wrong:**
External plugins can crash the app, corrupt state, or produce inconsistent source data.

**Why it happens:**
Teams want immediate openness without first defining a strict manifest and adapter schema.

**How to avoid:**
Start with a constrained plugin contract, runtime validation, and a built-in adapter path using the same interface.

**Warning signs:**
Plugins can call arbitrary internals, there is no schema validation, or version compatibility is undefined.

**Phase to address:**
Phase 1 and Phase 6

---

### Pitfall 4: Treating downloads as a side effect instead of a subsystem

**What goes wrong:**
Downloads cannot resume, fail silently, or write inconsistent folder structures.

**Why it happens:**
Downloading starts as a single button action before queueing, retries, and destination policies are designed.

**How to avoid:**
Model downloads as explicit jobs with status, retry, and destination semantics.

**Warning signs:**
No paused/failed state, restart loses progress, and no clear user-selected storage policy exists.

**Phase to address:**
Phase 5

---

### Pitfall 5: Superficial Arabic support

**What goes wrong:**
The app claims Arabic support but renders mixed-direction text poorly or leaves reader behavior inconsistent.

**Why it happens:**
Teams equate “translated strings” with full language support.

**How to avoid:**
Separate layout direction decisions from text direction, and verify Arabic content in metadata, lists, and reader settings.

**Warning signs:**
Broken punctuation ordering, clipped titles, unreadable mixed EN/AR labels, or missing RTL reader mode validation.

**Phase to address:**
Phase 1, Phase 3, and Phase 4

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hard-coding source logic in core modules | Faster first integration | Painful source expansion and plugin mismatch | Only for a disposable spike, not production scaffolding |
| In-memory download state only | Fast first demo | Broken resume/retry semantics | Never for the intended product |
| Skipping validation on plugin/source payloads | Less boilerplate | Data corruption and opaque runtime errors | Never |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Source websites | Assuming HTML shape is stable | Expect structural drift and centralize parser breakage handling |
| Local file imports | Treating each format as unrelated UI code | Normalize imported content into the same title/chapter domain model |
| External plugins | Loading them with full trust and no manifest checks | Validate manifests, versions, and adapter outputs before activation |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading huge libraries eagerly | Slow startup and choppy scrolling | Paginate library queries and lazy-load covers | Large libraries with many covers |
| Rendering full long-strip chapters naively | Reader lag and memory spikes | Incremental image loading and disposal strategy | Long webtoon chapters |
| Re-fetching source metadata too aggressively | Slow browse experience and avoidable source stress | Cache browse/detail responses with explicit refresh actions | Source-heavy usage |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing broad Node APIs to the renderer | Renderer compromise can reach filesystem/native APIs | Use preload bridges and narrow IPC contracts |
| Loading unvalidated plugins | Arbitrary plugin failures or abuse | Manifest/schema validation and bounded integration points |
| Downloading to ambiguous paths | File overwrite or messy storage behavior | Explicit user-selected destinations and normalized folder rules |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Forcing users into one reading mode | Reader feels wrong for part of the content | Support multiple modes and remember preferences |
| Hiding updates in a separate area only | Library feels stale and less actionable | Put new-chapter indicators directly on covers |
| Overcomplicated plugin UI before stability | Users cannot tell what is built-in vs external vs broken | Start with clear status, version, and source-origin indicators |

## "Looks Done But Isn't" Checklist

- [ ] **Reader:** Often missing accurate resume position - verify restart resumes chapter and in-chapter location
- [ ] **Downloads:** Often missing recoverable failed state - verify retry and restart behavior
- [ ] **Arabic support:** Often missing real mixed-direction testing - verify real Arabic titles and chapter names
- [ ] **Plugins:** Often missing compatibility/version guards - verify unsupported plugins fail clearly

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Source contract drift | MEDIUM | Fix adapter parser, add normalization regression test, republish adapter |
| Weak persistence model | HIGH | Migrate to SQLite, write one-time import, backfill IDs and progress data |
| Overbroad plugin privileges | HIGH | Restrict plugin surface, add manifest versions, invalidate unsafe plugins |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Source/UI coupling | Phase 1-2 | Source logic lives in adapters/services, not page components |
| Weak persistence | Phase 1 | Library/progress/download data survives restart and schema change |
| Fragile plugin runtime | Phase 1 and 6 | Invalid plugins fail safely with visible diagnostics |
| Download side effects | Phase 5 | Queue persists and retries behave predictably |
| Superficial Arabic support | Phase 3-4 | Real Arabic content is tested in library and reader flows |

## Sources

- [Electron Process Model](https://www.electronjs.org/docs/latest/tutorial/process-model) - security and process-boundary implications
- [Houdoku README](https://github.com/xgi/houdoku) - reference product structure and plugin/source shape
- Project constraints and user-stated scope - local-first, Arabic support, plugin extensibility, and offline reading focus

---
*Pitfalls research for: Windows-first desktop manhwa reader and library manager*
*Researched: 2026-05-18*
