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
const NAV_PANEL = 'nav.nav-rail'
// Expand the nav rail (persisted in localStorage), then open the dashboard so its
// charts render once at the final layout, and open the rail's Collections list.
const EXPAND_RAIL = [
  ['click', 'button.nav-rail-toggle'],
  ['goto', l => `/collection/${l.collectionId(C)}/stigs`],
  ['wait', CHART_SETTLE],
  ['hover', 'button.nav-rail-item:has-text("Collections")'],
  ['wait', 300],
]
const OPEN_REVIEW_POPOVER = [
  ['waitFor', 'table tbody tr'],
  ['click', 'table tbody tr >> nth=2'],
  ['waitFor', '.review-edit-popover'],
]

export const manifest = [
  // ---- user-guide.rst: layout and navigation
  {
    file: 'nav-tree-and-collection-panel.png',
    section: 'user-guide > Overall Organization',
    user: 'admin',
    route: '/',
    steps: EXPAND_RAIL,
    highlights: [{ selector: NAV_PANEL, shape: 'box', pad: 2 }],
  },
  {
    file: 'home-tab.png',
    section: 'user-guide > Home Tab',
    user: 'admin',
    route: '/',
  },
  {
    file: 'nav-tree.png',
    section: 'user-guide > Navigation Tree',
    user: 'admin',
    route: '/',
    steps: EXPAND_RAIL,
    clip: NAV_PANEL,
    scale: 2,
  },
  {
    file: 'create-collection-popup.png',
    section: 'user-guide > Collections > +Create Collection',
    user: 'admin',
    route: '/app-management/collections',
    steps: [
      ['click', 'button:has-text("New Collection")'],
      ['waitFor', '.p-dialog'],
    ],
    clip: '.p-dialog',
    clipPad: 24,
    scale: 2,
  },
  {
    file: 'stig-library.png',
    section: 'user-guide > STIG Library Tools > Browse STIGs',
    user: 'admin',
    route: '/stig-library',
  },
  {
    // Fixture has no STIG with two revisions, so this shows the benchmark view rather than a diff.
    file: 'stig-compare-tool.png',
    section: 'user-guide > STIG Library Tools > Compare Revisions',
    user: 'admin',
    route: '/stig-library/VPN_SRG_TEST/V1R1',
    steps: [['waitFor', 'table tbody tr'], ['click', 'table tbody tr >> nth=1']],
  },
  {
    file: 'nav-tree-interface-options.png',
    section: 'user-guide > Interface',
    user: 'admin',
    route: '/',
    steps: [
      ['click', 'li.p-menubar-item:has-text("Sign out") > .p-menubar-item-content'],
      ['waitFor', '.p-menubar-submenu'],
    ],
    clip: '.p-menubar-submenu',
    clipPad: 48,
    scale: 2,
  },
  // ---- user-guide.rst: Collection Dashboard
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
    scale: 2,
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
    scale: 2,
  },
  // ---- 2x samples of text-heavy views (not yet placed in the docs)
  {
    file: 'asset-review-2x.png',
    section: 'sample: Asset Review at 2x',
    user: 'admin',
    route: l => l.assetReviewRoute(C, 'Collection_X_asset', 'VPN_SRG_TEST'),
    steps: OPEN_REVIEW_POPOVER,
    scale: 2,
  },
  {
    file: 'stig-library-rule-2x.png',
    section: 'sample: STIG Library rule pane at 2x',
    user: 'admin',
    route: '/stig-library/VPN_SRG_TEST/V1R1',
    steps: [['waitFor', 'table tbody tr'], ['click', 'table tbody tr >> nth=1']],
    clip: '[class*="rule-pane"]',
    scale: 2,
  },
  // ---- other trial entries
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
    steps: OPEN_REVIEW_POPOVER,
  },
  {
    file: 'review-attributions-panel.png',
    section: 'user-guide > Asset Review Workspace > Review Panel',
    user: 'admin',
    route: l => l.assetReviewRoute(C, 'Collection_X_asset', 'VPN_SRG_TEST'),
    steps: OPEN_REVIEW_POPOVER,
    clip: '.review-edit-popover',
    clipPad: 16,
    scale: 2,
  },
  {
    file: 'asset-review-writeable.png',
    section: 'user-guide > Asset Review Workspace > Checklist Panel',
    user: 'admin',
    route: l => l.assetReviewRoute(C, 'Collection_X_asset', 'VPN_SRG_TEST'),
    steps: [['waitFor', 'table tbody tr']],
    clip: 'text=Writable',
    clipPad: 40,
    scale: 2,
  },
  {
    file: 'admin-users.png',
    section: 'admin-guide > Users Admin Panel',
    user: 'admin',
    route: '/app-management/users',
  },
]
