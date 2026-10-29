# `useAsyncState` — open TODOs

Latent hardening for `src/shared/composables/useAsyncState.js`. Neither item is
reachable today; both are traps for the next change. Best fixed together, since
both touch how the composable's generation counter and abort controller are exposed.

## Items

- [ ] **No `reset()` — manual state clears bypass the race guard.** Clearing state
  directly (e.g. `reviews.value = []` in `useFindingReviews`) doesn't bump the
  generation counter or abort, so an in-flight response can repopulate the cleared
  state. Not reachable today (the findings API returns only the active aggregator's
  key field per row, so no spurious fetch can start), but other features clear state
  manually the same way. Add a `reset()` that bumps generation, aborts, and restores
  `initialState`, then move manual clears onto it.

- [ ] **Abort signal is positional.** See below.

## Abort signal detail

Originated from the branch review of `new-client-findings-filters` (2026-09-09).

`useAsyncState` appends the signal *after* the caller's own arguments:

```js
const result = await promiseFactory(...args, { signal: abortController.signal })
```

So a factory that wants the signal has to declare it positionally, and that only
works while `args` is empty:

```js
// useFindings.js, useFindingReviews.js, useCollectionStigSummary.js
({ signal } = {}) => fetchFindings(collectionId.value, { ... }, { signal })
```

All three call `execute()` with no arguments today, so the signal lands in slot 0
and the destructure works. The day someone adds `execute(someArg)` to one of them,
`signal` silently becomes `someArg` (or `undefined`) — the request stops being
cancellable, with no error and no test failure. The `= {}` default swallows it.
`PoamExport.vue` already calls `execute(params)`; fine only because it never asks
for the signal.

Not a correctness bug today: the generation counter already discards stale results,
errors, and `isLoading` transitions whether or not the signal is used. Losing it
costs bandwidth and a server query that runs to completion for nothing.

### Options

- **Make the signal non-positional** (preferred). Pass a context object as a fixed,
  documented last argument, or a named property, so factories never depend on arity.
- **Or document the constraint** at both ends: a one-line comment on each
  signal-consuming factory plus a note in the `useAsyncState` JSDoc. Cheap, but
  relies on the next person reading it.
- **Or warn in dev** when `args.length > 0` and the factory looks like it expects the
  signal first. Noisy; probably not worth it.

Either way, update or remove the stale `NOTE ... TBD` comment above the
`promiseFactory` call — Findings has done that TBD, so it's wrong for three call
sites.
