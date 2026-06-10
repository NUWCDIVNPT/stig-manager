# AssetStigImport — open TODOs

Single-asset result import (Asset Review → grid header menu → Import Results…).

## Polish

- [ ] **Severity column in the preview step shows raw text.** `AssetStigPreviewStep.vue`
  renders severity as the raw API string ("medium") instead of the CAT badge used
  elsewhere. Fix: CatBadge body template — but rows can have empty severity (the
  mapper defaults to `''`), and CatBadge's validator only accepts 1/2/3, so the empty
  case needs a dash fallback.

See also in [common.md](common.md): `resultSortValue` wiring for this grid's
Current/New columns.
