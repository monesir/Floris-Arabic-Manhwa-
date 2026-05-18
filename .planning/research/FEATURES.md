# Feature Research

**Domain:** Windows-first desktop manhwa reader and library manager
**Researched:** 2026-05-18
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Browse from supported sources | Core reason to use a reader client instead of raw websites | MEDIUM | Must work for the named Arabic sites early. |
| Add title to library | Users expect persistent tracking beyond one-off reading | LOW | Foundation for updates, history, and downloads. |
| Continue reading with saved chapter/progress | Core convenience feature for any dedicated reader app | MEDIUM | Needs durable progress persistence, not session-only state. |
| Chapter list and title details | Standard navigation surface for serialized reading | LOW | Must support Continue/Read/Download actions. |
| Offline downloads | Expected in desktop manga/manhwa managers | MEDIUM | Requires queue state, retries, storage policy, and cleanup rules. |
| Reader settings and multiple reading modes | Different readers expect different layouts and fit modes | MEDIUM | Especially important for webtoon-style content and RTL support. |
| Library organization | Libraries become unusable quickly without search/filter/status/list tools | MEDIUM | Covers, statuses, favorites, lists, and sorting are core. |
| Local import | Users often keep personal archives | MEDIUM | Folder/CBZ/PDF import should not feel secondary. |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Arabic-first source focus | Better fit for the user’s actual ecosystem than generic global readers | MEDIUM | Source quality matters more than source count initially. |
| Reading time analytics per title | Gives a more personal and “collector” feel than minimal progress tracking | MEDIUM | Needs reliable session timing and aggregation logic. |
| Custom user-defined lists | Lets users organize by personal intent, not just fixed statuses | LOW | Useful for workflows similar to Keiyoushi. |
| Built-in plus external plugin model | Makes the product extensible without forcing all sources into core | HIGH | Strong long-term value if contract boundaries are clean. |
| New chapter indicators over covers | Brings updates into the main library workflow | LOW | Good product feedback loop without a separate tracker service. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Account system and cloud sync in V1 | Users assume sync is modern/default | Adds auth, conflict resolution, hosting, privacy, and support burden far too early | Keep V1 strictly local-first and revisit after core reading flow is stable |
| Too many sources from day one | Feels more “complete” on paper | Multiplies scraper breakage, maintenance, and QA burden before the architecture proves itself | Start with a small curated set and a clean extension API |
| Automatic translation in V1 | Attractive headline feature | Expands scope into AI cost, UX ambiguity, and text-layer extraction problems | Defer until the reader and source stack are reliable |
| Full mirrored RTL application layout | Seems aligned with Arabic support | Increases design and implementation surface without improving the main reading loop proportionally | Support Arabic text and reader RTL mode first |

## Feature Dependencies

```text
Source browsing
    └── requires -> Source adapter runtime
                      └── requires -> Persistence for source/library state

Continue reading
    └── requires -> Reader progress persistence
                      └── requires -> Title/chapter identity model

Offline downloads
    └── requires -> Chapter asset resolution
                      └── requires -> Source adapter contracts

Custom lists -> enhances -> Library organization
New chapter indicators -> enhances -> Library browsing

Cloud sync -> conflicts with -> local-first MVP simplicity
```

### Dependency Notes

- **Source browsing requires adapter runtime:** the app cannot browse online content until source contracts and parsing flows exist.
- **Continue reading requires stable title/chapter identity:** progress is meaningless if chapter identity changes across source refreshes.
- **Offline downloads require chapter asset resolution:** source adapters must expose downloadable chapter/image payloads consistently.
- **Cloud sync conflicts with local-first MVP:** it changes the storage and product boundary too early.

## MVP Definition

### Launch With (v1)

- [ ] Source browse/search for the initial Arabic sites - essential to validate the real usage path
- [ ] Add to library and organize titles - core retained-value loop
- [ ] Details page with chapter list - basic title workflow
- [ ] Reader with saved progress and major viewing modes - core product experience
- [ ] Offline downloads manager - expected desktop capability
- [ ] Local import for folders/CBZ/PDF - broadens usefulness and resilience
- [ ] Reading history and time tracking - explicitly requested and product-shaping
- [ ] Plugin-ready source architecture - prevents painful re-architecture later

### Add After Validation (v1.x)

- [ ] More source adapters - once the first integrations are proven stable
- [ ] Richer plugin management UX - after the runtime contract settles
- [ ] More analytics surfaces - after the data model proves useful

### Future Consideration (v2+)

- [ ] Automatic translation features - defer until reading and source flows are mature
- [ ] Optional sync/export services - only after local-first usage is stable
- [ ] Cross-platform packaging beyond Windows - once Windows distribution is solid

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Source browse and add-to-library | HIGH | MEDIUM | P1 |
| Reader with progress resume | HIGH | MEDIUM | P1 |
| Library organization and lists | HIGH | MEDIUM | P1 |
| Offline downloads | HIGH | MEDIUM | P1 |
| Plugin runtime | HIGH | HIGH | P1 |
| Reading analytics/time tracking | MEDIUM | MEDIUM | P2 |
| Expanded plugin UX | MEDIUM | MEDIUM | P2 |
| Auto translation | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Houdoku | Keiyoushi-style ecosystem | Our Approach |
|---------|---------|----------------------------|--------------|
| Source model | Plugin-based third-party source access | Extension-heavy source ecosystem | Start with built-in adapters plus external plugin support |
| Reader | Customizable, desktop-oriented | Reader options and library-centric usage | Match the flexible reader expectation, including RTL and webtoon modes |
| Library management | Tags/filtering/import/download | Strong organizational workflows | Emphasize organization, custom lists, updates, and local-first tracking |

## Sources

- [Houdoku README](https://github.com/xgi/houdoku) - baseline reference product capabilities
- User-specified product direction from project questioning - source focus, analytics, tracking depth, and language behavior

---
*Feature research for: Windows-first desktop manhwa reader and library manager*
*Researched: 2026-05-18*
