# Requirements: FloirsMNH

**Defined:** 2026-05-18
**Core Value:** Reading from selected sources and managing a personal manhwa library must feel reliable, organized, and local-first without requiring any account or cloud dependency.

## v1 Requirements

### Platform Shell

- [ ] **PLAT-01**: User can open a Windows desktop app with a persistent sidebar for Library, Browse, Updates, History, Downloads, Settings, and Plugins.
- [ ] **PLAT-02**: User settings persist locally across app restarts.
- [ ] **PLAT-03**: User can change application language through settings, with English as the base UI and Arabic text rendered correctly when selected.

### Sources and Plugins

- [ ] **SRC-01**: User can browse titles from the initial supported source set, including `azoramoon.com` and `olympustaff.com`.
- [ ] **SRC-02**: User can search within a supported source and open a title details view.
- [ ] **SRC-03**: User can add a source title to the local library from the browse flow.
- [ ] **PLUG-01**: The app can load built-in source adapters through a shared source contract.
- [ ] **PLUG-02**: The app can discover and validate external source plugins from a plugins directory without crashing the app on invalid input.

### Library and Organization

- [ ] **LIB-01**: User can view their library as a cover-based collection of saved titles.
- [ ] **LIB-02**: User can assign and change a reading status for a title, including active and completed-style states.
- [ ] **LIB-03**: User can search, sort, and filter the library by common library fields such as status and favorites.
- [ ] **LIB-04**: User can mark titles as favorites.
- [ ] **LIB-05**: User can create and manage custom lists for organizing titles.
- [ ] **LIB-06**: User can see a visible new-chapter indicator on a library cover when updates are detected.

### Title Detail and Updates

- [ ] **TITLE-01**: User can open a title details page with cover art, metadata, reading state, and chapter list.
- [ ] **TITLE-02**: User can start reading, continue reading, or queue downloads from the title details page.
- [ ] **UPDT-01**: User can access an Updates view that shows recently detected chapter updates for tracked library titles.

### Reader

- [ ] **READ-01**: User can read a chapter in a dedicated reader view with side-panel reader settings.
- [ ] **READ-02**: User can switch among vertical, horizontal paged, RTL, and long-strip webtoon reading modes.
- [ ] **READ-03**: User can use fit-width, fit-height, and zoom controls while reading.
- [ ] **READ-04**: User can move to the previous or next chapter from the reader.
- [ ] **READ-05**: User's last read chapter and in-chapter position persist automatically.

### Downloads and Import

- [ ] **DL-01**: User can download chapters for offline reading into app-managed storage.
- [ ] **DL-02**: User can choose an external destination for downloaded chapter assets.
- [ ] **DL-03**: User can view download queue items with pending, paused, completed, and failed states.
- [ ] **DL-04**: User can retry failed downloads.
- [ ] **IMP-01**: User can import local content from chapter/image folders.
- [ ] **IMP-02**: User can import local content from `CBZ` and `PDF` files.

### Tracking and Analytics

- [ ] **TRK-01**: User can view reading history showing recently opened titles and chapters.
- [ ] **TRK-02**: The app records reading session duration and aggregates total reading time per title.
- [ ] **TRK-03**: User can view total reading time for a manhwa from a settings-facing analytics surface or equivalent app surface.

## v2 Requirements

### Sources and Ecosystem

- **SRC-04**: User can add many more Arabic and non-Arabic sources beyond the initial curated set.
- **PLUG-03**: User can install, update, and manage plugins through a richer plugin marketplace-style workflow.

### Reader Intelligence

- **READ-06**: User can access automatic translation assistance while reading.
- **READ-07**: User can customize advanced per-source or per-title reader presets.

### Distribution and Sync

- **SYNC-01**: User can sync library and progress across devices.
- **DIST-01**: The app supports additional desktop platforms beyond Windows.

## Out of Scope

| Feature | Reason |
|---------|--------|
| User login/account system | Explicitly rejected for the local-first MVP |
| Cloud sync in v1 | Conflicts with current scope and adds remote service complexity |
| Broad source coverage from day one | Early scope should prioritize a small real source set over breadth |
| Automatic translation in v1 | Deferred until the core reading product is stable |
| Full application-wide RTL layout mirroring | User wants Arabic support without reversing the full layout |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAT-01 | Phase 1 | Pending |
| PLAT-02 | Phase 1 | Pending |
| PLAT-03 | Phase 1 | Pending |
| PLUG-01 | Phase 1 | Pending |
| SRC-01 | Phase 2 | Pending |
| SRC-02 | Phase 2 | Pending |
| SRC-03 | Phase 2 | Pending |
| TITLE-01 | Phase 2 | Pending |
| LIB-01 | Phase 3 | Pending |
| LIB-02 | Phase 3 | Pending |
| LIB-03 | Phase 3 | Pending |
| LIB-04 | Phase 3 | Pending |
| LIB-05 | Phase 3 | Pending |
| LIB-06 | Phase 3 | Pending |
| UPDT-01 | Phase 3 | Pending |
| READ-01 | Phase 4 | Pending |
| READ-02 | Phase 4 | Pending |
| READ-03 | Phase 4 | Pending |
| READ-04 | Phase 4 | Pending |
| READ-05 | Phase 4 | Pending |
| TITLE-02 | Phase 4 | Pending |
| DL-01 | Phase 5 | Pending |
| DL-02 | Phase 5 | Pending |
| DL-03 | Phase 5 | Pending |
| DL-04 | Phase 5 | Pending |
| IMP-01 | Phase 5 | Pending |
| IMP-02 | Phase 5 | Pending |
| TRK-01 | Phase 5 | Pending |
| TRK-02 | Phase 5 | Pending |
| TRK-03 | Phase 5 | Pending |
| PLUG-02 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-18*
*Last updated: 2026-05-18 after initial definition*
