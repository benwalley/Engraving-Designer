# Engraving Designer

Web component app built with Lit 3 and Vite.

## Architecture

```
src/
├── main.js                   # Entry — imports components to register them
├── components/
│   └── version-picker.js     # <version-picker> LitElement
└── helpers/
    ├── events.js             # In-memory pub/sub event bus
    ├── local-db.js           # IndexedDB (version records)
    └── local-storage.js      # localStorage (general app state)
```

## Data Flow

**Persistence is split across two stores:**
- `local-db.js` — IndexedDB, stores version objects (`{ id, ... }`), async Promise API
- `local-storage.js` — localStorage, stores all other app state as a single JSON blob under key `engraving-app`, sync API

**Components communicate via the event bus (`events.js`)**, not by calling each other directly:
- `emit(EVENTS.VERSION_SELECTED, data)` — user picked a version
- `emit(EVENTS.VERSION_SAVED, data)` — version written to IndexedDB
- `emit(EVENTS.VERSION_DELETED, data)` — version removed from IndexedDB

**Typical CRUD cycle:**
1. User action in component → `saveVersion(v)` / `deleteVersion(id)` in `local-db.js`
2. On success, component emits the relevant event via `events.emit()`
3. Other components subscribed via `events.on()` update their state and call `this.requestUpdate()`

**Component init pattern** (`connectedCallback`):
1. `getVersions()` from IndexedDB
2. Render list; fall back to a default option if empty
3. Register `events.on()` listeners for CRUD events

## Key Rules

- All components extend `LitElement` (not plain `HTMLElement`)
- Database operations are always async — await `saveVersion`, `getVersions`, `deleteVersion`
- Do not store version data in localStorage; IndexedDB is the source of truth for versions
