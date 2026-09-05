// One entry per generated image in docs/assets/images.
//   file       output filename (must match the thumbnail:: directive in the docs)
//   section    where the docs use it (for the review sheet)
//   user       key into `users` below; entries sharing a user share one login
//   route      client route, or async (lookup) => route for name-based ids
//   steps      [op, ...args] from lib/steps.mjs, run after navigation
//   clip       selector; capture only that element (clipPad: extra pixels of context around it)
//   highlights [{ selector, shape: 'ellipse'|'box'|'arrow', label?, pad?, from? }]
//   viewport   override the default viewport for this entry
// Data names refer to the seed fixture; see README.

export const users = {
  admin: { username: 'admin', admin: true, createCollection: true },
  owner: { username: 'lvl4', admin: false, createCollection: true },
  restricted: { username: 'lvl1', admin: false, createCollection: false },
}

const C = 'Collection X' // primary demo collection; overridden once the fixture is chosen

// Dashboards draw Chart.js charts that animate for about a second after data arrives;
// give those entries a longer settle so the capture shows the finished chart.
const CHART_SETTLE = 1500

export const manifest = [
  {
    file: 'home-tab.png',
    section: 'user-guide > Home',
    user: 'admin',
    route: '/',
  },
  {
    file: 'collection-panel.png',
    section: 'user-guide > Collection Dashboard',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/stigs`,
    settleMs: CHART_SETTLE,
  },
  {
    file: 'collection-panel-overview.png',
    section: 'user-guide > Collection Dashboard > Collection Overview',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/stigs`,
    settleMs: CHART_SETTLE,
    clip: '.dashboard-sidebar',
  },
  {
    file: 'collection-overview-cora.png',
    section: 'user-guide > Collection Dashboard > CORA (candidate)',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/stigs`,
    settleMs: CHART_SETTLE,
    clip: '.cora-card',
  },
  {
    file: 'collection-panel-filters.png',
    section: 'user-guide > Collection Dashboard > Collection Overview (filters)',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/stigs`,
    steps: [
      ['wait', CHART_SETTLE],
      ['click', '.metrics-multiselect'],
      ['waitFor', '.p-multiselect-overlay, .p-multiselect-panel'],
    ],
    clip: '.dashboard-sidebar',
  },
  {
    file: 'meta-collection-dashboard.png',
    section: 'user-guide > Meta-Collection Dashboard',
    user: 'admin',
    route: '/collections',
    settleMs: CHART_SETTLE,
  },
  {
    file: 'manage-collection-workspace.png',
    section: 'user-guide > Collection Management Workspace',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
  },
  {
    file: 'asset-review.png',
    section: 'user-guide > Asset Review Workspace',
    user: 'admin',
    route: l => l.assetReviewRoute(C, 'Collection_X_asset', 'VPN_SRG_TEST'),
    steps: [
      ['waitFor', 'table tbody tr'],
      ['click', 'table tbody tr >> nth=2'],
      ['waitFor', '.review-edit-popover'],
    ],
  },
  {
    file: 'review-attributions-panel.png',
    section: 'user-guide > Asset Review Workspace > Review Panel',
    user: 'admin',
    route: l => l.assetReviewRoute(C, 'Collection_X_asset', 'VPN_SRG_TEST'),
    steps: [
      ['waitFor', 'table tbody tr'],
      ['click', 'table tbody tr >> nth=2'],
      ['waitFor', '.review-edit-popover'],
    ],
    clip: '.review-edit-popover',
    clipPad: 16,
  },
  {
    file: 'asset-review-writeable.png',
    section: 'user-guide > Asset Review Workspace > Checklist Panel',
    user: 'admin',
    route: l => l.assetReviewRoute(C, 'Collection_X_asset', 'VPN_SRG_TEST'),
    steps: [['waitFor', 'table tbody tr']],
    clip: 'text=Writable',
    clipPad: 40,
  },
  {
    file: 'admin-users.png',
    section: 'admin-guide > Users Admin Panel',
    user: 'admin',
    route: '/app-management/users',
  },
]
