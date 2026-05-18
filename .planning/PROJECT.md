# FloirsMNH

## What This Is

FloirsMNH is a Windows-first desktop manhwa reader and library manager built with Electron. It is intended to be functionally similar to Houdoku, with a sidebar-based app shell, integrated Arabic web sources, local import support, offline downloads, comprehensive reading tracking, and a configurable reader experience. The product is meant to be publishable for end users rather than a private personal tool.

## Core Value

Reading from selected sources and managing a personal manhwa library must feel reliable, organized, and local-first without requiring any account or cloud dependency.

## Requirements

### Validated

(None yet - ship to validate)

### Active

- [ ] Provide a Windows desktop application using Electron with a sidebar layout and separate pages for Library, Browse, Updates, History, Downloads, Settings, and Plugins.
- [ ] Support selected Arabic online manhwa sources in V1, currently including `https://azoramoon.com/` and `https://olympustaff.com/`.
- [ ] Implement a source architecture that supports both built-in source adapters and external plugins loaded from a plugins directory.
- [ ] Allow users to browse from sources, add titles to the local library, and organize the library with covers, genres, search, status filters, favorites, latest updates, custom ordering, and custom user-defined lists similar in spirit to Keiyoushi.
- [ ] Support local import for chapter folders, image folders, `CBZ`, and `PDF`.
- [ ] Provide a title details page with cover, metadata, reading state, chapter list, and primary actions such as Read, Continue, and Download.
- [ ] Provide a configurable reader with a side settings panel, automatic progress saving, chapter navigation, and support for vertical, horizontal paged, RTL reading mode, long-strip webtoon mode, fit-width, fit-height, and zoom.
- [ ] Track reading progress locally, including last read chapter, in-chapter progress, recent activity, reading history, per-session duration, last read timestamp, and total reading time per title.
- [ ] Expose reading analytics and a visible reading log, including a settings-facing view that shows total time spent per manhwa.
- [ ] Support flexible downloads with user-controlled behavior, including in-app offline storage and export to a user-selected external folder.
- [ ] Provide a downloads manager with queue state, paused/completed/failed statuses, retry controls, and destination management.
- [ ] Surface updates for tracked titles by showing new-chapter indicators on the title cover within the library UI.
- [ ] Provide English as the base UI language and support Arabic UI text with RTL text rendering where needed, exposed through a language setting designed for future expansion.
- [ ] Keep all tracking local-first with no login and no cloud synchronization in V1.

### Out of Scope

- User accounts and authentication - explicitly rejected because the product must remain local-first and frictionless.
- Cloud sync across devices - explicitly excluded from V1 because the user does not want account coupling or remote dependency.
- Broad source coverage from the start - deferred because V1 should begin with a small curated set of Arabic sources.
- Automatic translation features - deferred to a later phase because the initial goal is a stable reading and library product.
- Flipping the full application layout into RTL - excluded for V1 because the preference is to keep the general layout stable while supporting RTL text where needed.

## Context

The project starts as a greenfield Windows desktop application in `D:\clwd\FloirsMNH` with no existing codebase, `.planning` state, or git repository initialized yet. The product direction is explicitly inspired by Houdoku's model: a desktop reader and library manager with plugin-based content sources, filesystem import, offline downloads, and a configurable reader. Unlike a generic manga client, this project is focused first on Arabic manhwa sources and on a polished desktop library workflow that includes reading history, progress persistence, custom lists, and reading-time analytics.

The initial online source scope is intentionally narrow: Arabic manhwa websites, with `azoramoon.com` and `olympustaff.com` named as the first targets. The user wants system extensibility from the start, not as a retrofit, so source integration must be designed as a first-class plugin-capable subsystem rather than a one-off scraper layer. The product should be publishable, which raises the bar for packaging, plugin boundaries, storage durability, update behavior, and operational resilience when source sites change structure.

The interface direction is also materially defined already. The app shell should use a left sidebar with separate pages for Library, Browse, Updates, History, Downloads, Settings, and Plugins. The reader should use a side settings panel rather than a top-heavy controls model. Updates should be visible directly from the library view via new-chapter indicators over title covers. Arabic support is required, but the current preference is text-level RTL support and Arabic localization within an otherwise stable primary layout.

## Constraints

- **Tech stack**: Electron is required for the desktop shell - this was explicitly chosen to stay close to the Houdoku model and Windows desktop expectations.
- **Platform**: Windows-first delivery - V1 is targeted at Windows rather than cross-platform parity.
- **Architecture**: Plugin-capable source system from the beginning - retrofitting a plugin model later would create avoidable architectural churn.
- **Product boundary**: Local-first data model with no login or sync - user identity and cloud dependencies are outside the intended product shape.
- **Source scope**: Arabic online manhwa sources first - the early roadmap should optimize for a small number of real sites rather than generic unsupported breadth.
- **UX**: English-first UI with Arabic support - text localization and RTL text handling must be planned without redesigning the whole layout around RTL.
- **Publishability**: The application is intended for distribution - packaging, persistence, upgrade safety, and plugin handling need production-grade decisions rather than throwaway prototypes.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use Electron for the desktop application | The target is a Windows desktop app and the reference product, Houdoku, follows an Electron architecture | - Pending |
| Model sources as both built-in adapters and external plugins | The user wants immediate extensibility without locking the codebase into hard-coded source implementations | - Pending |
| Prioritize selected Arabic web sources first | V1 should solve a concrete acquisition problem before broadening source support | - Pending |
| Keep tracking and analytics local-only | The product must not depend on accounts or cloud synchronization | - Pending |
| Support import for folders, images, `CBZ`, and `PDF` in V1 | Local import is part of the core reader/library promise, not a secondary convenience feature | - Pending |
| Keep the main application layout stable instead of fully mirroring RTL | The user wants Arabic support, but not a full RTL layout inversion for the whole app | - Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition**:
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone**:
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-18 after initialization*
