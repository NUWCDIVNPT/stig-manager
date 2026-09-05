# Documentation screenshots

Generates the client screenshots in `docs/assets/images` from `manifest.mjs`, and checks the committed images for drift after UI changes.

## Layout

| File | Purpose |
|---|---|
| `manifest.mjs` | One entry per generated image: route, setup steps, clip, highlights |
| `static-images.mjs` | Doc images that are not generated (diagrams, third-party tools) |
| `capture.mjs` | `capture` writes images, `check` diffs against committed images, `sheet` builds a review page |
| `stack.mjs` | Starts mock OIDC, the API, and the Vite dev client for a local run |
| `seed.mjs` | Loads an appdata export into the running stack |
| `lint.mjs` | Cross-checks docs, manifest, and image files |
| `config.mjs` | Ports, URLs, viewport, tolerances; all overridable by `SHOTS_*` env vars |

## Local run

```
cd docs/screenshots
npm ci
npx playwright install chromium-headless-shell   # first time only
npm run db                                      # throwaway MySQL on :3308
npm run stack -- --seed ../../data/appdata/demo-appdata.jsonl.gz
```

In another terminal:

```
npm run capture                # all entries
npm run capture -- --only asset-review
npm run check                  # reports drift, writes .out/diff/*.png
npm run sheet && xdg-open .out/sheet.html
npm run lint
```

`stack.mjs` writes an admin token to `.stack/admin.token`, which `capture` uses for name-to-id lookups. To capture against a stack you started yourself, set `SHOTS_CLIENT_URL`, `SHOTS_API_URL`, and `SHOTS_TOKEN`.

## Adding a screenshot

1. Add a `thumbnail::` directive to the doc.
2. Add a manifest entry with the same filename. Name data by collection, asset, and label name rather than id.
3. `npm run capture -- --only <name>` and check the result.
4. `npm run lint` to confirm the doc and manifest agree.

Steps are `[op, ...args]` with ops `goto`, `click`, `dblclick`, `hover`, `fill`, `press`, `wait`, `waitFor`, `idle`, and `run` (an async function escape hatch). Selectors are Playwright selector strings.

`clip` captures one element; `clipPad` adds pixels of surrounding context. Dashboards animate their charts for about a second after data arrives, so those entries set a longer `settleMs`.

Highlights are anchored to selectors, so they follow the element when the layout changes. Shapes are `ellipse` (default), `box`, and `arrow`; an optional `label` prints text beside the shape.

## Determinism

Animations and transitions are disabled, the viewport and device scale are fixed, and all entries render from the same seed fixture. Font rendering still differs between machines, so `check` is meaningful only against images produced on the same platform. Committed images should come from the CI regeneration job.

## Future enhancements

- Freeze the browser clock so relative timestamps do not drift between runs.
- Add a workflow that runs `check` on client pull requests and uploads the diffs as an artifact.
- Add a `workflow_dispatch` job that runs `capture` and opens a pull request with the regenerated images.
