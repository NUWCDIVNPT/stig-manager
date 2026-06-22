# Findings feature — open TODOs

Originated from the branch review of `new-client-findings-individual-row-tests` vs
`new-client` (2026-06-10). Cross-cutting items from that review live in
[common.md](common.md).

## Behavior / UX (decide, then do or close)

- [ ] **Label-filter inconsistency hint.** Only the STIG summary metrics honor the
  label filter; findings/reviews panes do not (server-side gap — see
  `clientV2/docs/pending-api-enhancements.md` #1/#2). Until the API catches up,
  consider a small UI hint in the panes so users understand why counts disagree with
  the header.
