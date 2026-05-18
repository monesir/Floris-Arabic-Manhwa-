# Phase 2 Research

## Product Fit

The first real online phase should minimize invisible failure modes. For these sources, the main risk is not HTML parsing alone but wrongly assuming that all listed chapters are accessible. A normalized availability state is therefore a first-order data concern, not a UI afterthought.

## Architecture Implications

- Source fetching and parsing should stay outside the renderer.
- The source runtime should return normalized models only.
- Title details likely become the first cross-cutting data-rich screen after Settings.

## Early Risks

- Site HTML may drift frequently.
- Paid/locked chapter surfaces may look similar to readable chapter surfaces until inspected.
- Source IDs and chapter IDs must stay stable enough to support later library/progress phases.
