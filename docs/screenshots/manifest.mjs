// One entry per generated image in docs/assets/images.
//   file       output filename (must match the thumbnail:: directive in the docs)
//   section    where the docs use it (for the review sheet)
//   user       key into `users` below; entries sharing a user share one login
//   route      client route, or async (lookup) => route for name-based ids
//   steps      [op, ...args] from lib/steps.mjs, run after navigation
//   clip       selector; capture only that element
//   highlights [{ selector, shape: 'ellipse'|'box'|'arrow', label?, pad?, from? }]
//   viewport   override the default viewport for this entry
// Data names refer to the seed fixture; see README.

export const users = {
  admin: { username: 'admin', admin: true, createCollection: true },
  owner: { username: 'lvl4', admin: false, createCollection: true },
  restricted: { username: 'lvl1', admin: false, createCollection: false },
}

const C = 'Collection X' // primary demo collection; overridden once the fixture is chosen

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
      ['waitFor', '[data-testid="review-popover"], .p-popover'],
    ],
  },
]
