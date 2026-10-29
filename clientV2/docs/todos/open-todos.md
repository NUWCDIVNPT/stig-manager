# Open TODOs

Consolidated list of items still open. Details for each live in the linked source doc.

## CSV export — [csv-export.md](csv-export.md)

- [ ] **Classification "Marking" column is missing.** Product decision, then one fix
  in `shared/csv.js`. Own PR.
- [ ] **Fidelity audit** against the legacy client, grid by grid.

## `useAsyncState` — [use-async-state.md](use-async-state.md)

- [ ] **No `reset()`.** Manual state clears bypass the race guard.
- [ ] **Abort signal is positional.** Three factories destructure `({ signal } = {})`;
  stale `NOTE ... TBD` comment remains.

## URL state — [url-state.md](url-state.md)

- [ ] App-wide URL state effort: tab query save/restore (prototype stashed), STIGs tab
  URL state, label filter carry. Own PR.

## API (server-side, blocked)

See [pending-api-enhancements.md](pending-api-enhancements.md) — none landed yet.

- [ ] Rule text search (`/stigs/rules/search`)
- [ ] Asset search across collections (`getAssets` takes a single required `collectionId`)
- [ ] Prior-revision rule content (`/stigs/{benchmarkId}/rules/{ruleId}/revisions`)
- [ ] Label params on `getPoamByCollection`
