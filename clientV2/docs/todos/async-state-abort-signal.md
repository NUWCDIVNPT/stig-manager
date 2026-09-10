# `useAsyncState` abort-signal contract — latent trap

Originated from the branch review of `new-client-findings-filters` vs
`new-client-findings-filters-review` (2026-09-09). The signal-threading described
here lands with that review branch; it is not on `new-client-findings-filters`.
Related latent item in [common.md](common.md) → "Hardening".

## The problem

`useAsyncState` appends the signal *after* the caller's own arguments
(`src/shared/composables/useAsyncState.js:61`):

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
cancellable, and there is no error, no type failure, and no test failure. The
`= {}` default is what swallows it.

`PoamExport.vue:24` is the shape that already breaks the assumption: it calls
`execute(params)` and ignores the signal entirely. That is fine only because it
never asked for one.

## Why it is not a correctness bug today

`useAsyncState`'s generation counter (`:46`, `:64`, `:74`, `:91`) already discards
stale results, errors, and `isLoading` transitions regardless of whether anyone
uses the signal. Losing the signal costs bandwidth and a server-side query that
runs to completion for nothing — it cannot corrupt state.

## Options

- [ ] **Make the signal non-positional.** Pass it as a property on a context object,
  or expose it as `promiseFactory(...args, ctx)` where `ctx` is always last *and*
  documented as such, with the factories destructuring from a named slot rather than
  from "whatever arrived first". Removes the arity dependency entirely.

- [ ] **Or: document the constraint at both ends.** A one-line comment on each
  signal-consuming factory ("signal only arrives in slot 0 while `execute()` takes no
  args") plus a note in the `useAsyncState` JSDoc. Cheap, but relies on the next
  person reading it.

- [ ] **Or: assert in dev.** Warn from `useAsyncState` when `args.length > 0` and the
  factory's `length` suggests it expects the signal first. Noisy; probably not worth it.

The `NOTE ... TBD` comment at `useAsyncState.js:58-60` should be updated or removed
once this is settled — the Findings feature has now done that TBD, so the note is
stale for three call sites and still accurate everywhere else.
