---
tags: [draft]
---
# Dynasty GM 3.0 — Architecture Ideas

## Data Layer
- Convex for real-time player data sync
- Cache player stats locally for offline access
- Background sync with fantasy platform APIs

## Feature Domains (Screaming Architecture)
```
features/
  trade-calculator/
  player-comparison/
  draft-board/
  roster-management/
```

Each feature owns its queries, mutations, components, and types.
