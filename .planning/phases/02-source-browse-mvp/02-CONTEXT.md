# Phase 2: Source Browse MVP - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the first real online source workflows for FloirsMNH: browse initial Arabic sources, search within them, open normalized title details, and prepare add-to-library entry points. This phase does not yet implement reader progress, downloads, payments, account flows, or full library organization.

</domain>

<decisions>
## Implementation Decisions

### Source Scope
- **D-01:** Phase 2 should target the first two Arabic sources already locked at the project level: `azoramoon.com` and `olympustaff.com`.
- **D-02:** Source implementations should conform to the Phase 1 shared source contract and plugin/source identity model instead of inventing per-site ad hoc models.
- **D-03:** Built-in source adapters remain the active runtime path in Phase 2; external plugin execution stays deferred.

### Access and Content Availability
- **D-04:** Phase 2 should support publicly accessible browsing, search, title details, chapter listing, and accessible chapter-page extraction only.
- **D-05:** Locked, paid, or login-gated chapters must be represented explicitly as unavailable/locked content, not bypassed and not treated as normal readable chapters.
- **D-06:** No account, login, coin, or purchase workflow should be implemented in Phase 2.

### Normalization Boundary
- **D-07:** The app should normalize source browse results into shared title-summary objects, not pass raw site HTML structures into the renderer.
- **D-08:** Title details should include at least source identity, title name, cover, status, tags/genres, summary, and normalized chapter list.
- **D-09:** Chapter records should carry stable source chapter identity, display title, chapter number when derivable, and an availability state that can express `readable` versus `locked`.

### UI and User Flow
- **D-10:** `Browse` becomes the main real Phase 2 route, not a placeholder.
- **D-11:** The user should be able to select a source, inspect browse results, run a source search, and open a title details view.
- **D-12:** Phase 2 should prove title details and chapter-list rendering even if add-to-library is finalized in the later plan of the same phase.

### the agent's Discretion
- Exact HTML parsing approach per source
- Exact HTTP client choice inside Electron/main services
- Exact split between browse/search repository code and source-adapter runtime code
- Exact UI composition of browse/detail pages as long as it preserves the product direction and Phase 2 success criteria

</decisions>

<source_recon>
## Live Source Reconnaissance

### Azora Moon (`azoramoon.com`)
- The site uses title paths of the form `/series/<slug>`.
- A sampled title page exposed:
  - cover and background imagery
  - status
  - type
  - chapter count
  - last update
  - summary
  - tags
  - chapter list
- A sampled readable chapter used a path of the form `/series/<slug>/chapter-1` and exposed inline page images directly in the HTML.
- A sampled locked chapter used a path of the form `/series/<slug>/chapter-22` and explicitly showed:
  - locked state
  - coin price
  - login requirement
- This confirms Azora needs a chapter availability model from day one instead of assuming all listed chapters are readable.

### Olympus Staff (`olympustaff.com`)
- The site exposes clear title pages under `/series/<id-or-sluglike-key>`.
- A sampled title page exposed:
  - title metadata
  - genre tags
  - status
  - summary
  - chapter list
  - first/latest chapter entry points
- The chapter list appears richer than a minimal card feed and is suitable for normalization into title details.
- The site also exposes payment/support language on title pages, so the app must distinguish metadata visibility from chapter readability assumptions.

</source_recon>

<specifics>
## Specific Ideas

- The first browse implementation should prove source switching between Azora and Olympus rather than over-optimizing one source only.
- Search should be source-scoped in Phase 2 instead of pretending to be a global cross-source search.
- Title details should move toward the Houdoku-inspired composition already discussed, but in Phase 2 the priority is normalized data fidelity over visual completeness.
- Chapter availability should be visible in the detail view so the user can see when a source chapter is locked instead of silently failing.

</specifics>

<canonical_refs>
## Canonical References

### Project scope and requirements
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`

### Upstream phase outputs
- `.planning/phases/01-foundation-shell/01-CONTEXT.md`
- `.planning/phases/01-foundation-shell/01-02-SUMMARY.md`
- `.planning/phases/01-foundation-shell/01-03-SUMMARY.md`

### Live source observations
- `https://azoramoon.com/`
- `https://azoramoon.com/series/the-oracle-of-the-villainous-baby`
- `https://azoramoon.com/series/the-oracle-of-the-villainous-baby/chapter-1`
- `https://azoramoon.com/series/the-oracle-of-the-villainous-baby/chapter-22`
- `https://olympustaff.com/`
- `https://olympustaff.com/series/SIR`

</canonical_refs>

<deferred>
## Deferred Ideas

- Account/login support
- Coin or purchase workflow
- Automatic chapter unlock
- Cross-source merged search
- Full reader integration and progress persistence
- Download handling and offline storage

</deferred>

---

*Phase: 02-source-browse-mvp*
*Context gathered: 2026-05-18*
