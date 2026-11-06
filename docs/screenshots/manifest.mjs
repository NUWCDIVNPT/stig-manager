// One entry per generated image in docs/assets/images.
//   file       output filename (must match the thumbnail:: directive in the docs)
//   section    where the docs use it (for the review sheet)
//   user       key into `users` below; entries sharing a user share one login
//   route      client route, or async (lookup) => route for name-based ids
//   steps      [op, ...args] from lib/steps.mjs, run after navigation
//   clip       selector; capture only that element (clipPad: extra pixels of context around it)
//   highlights [{ selector, shape: 'ellipse'|'box'|'arrow', label?, pad?, from? }]
//   rail       'expanded' to show the Nav Rail open; collapsed otherwise (the default)
//   scale      device scale factor (2 for crisp close-ups)
//   viewport   override the default viewport for this entry
// Data names refer to the seed fixture; see README.

export const users = {
  admin: { username: 'admin', admin: true, createCollection: true },
  owner: { username: 'stigmanadmin', admin: false, createCollection: true },
  restricted: { username: 'user02', admin: false, createCollection: false },
}

const C = 'Miskatonic-Lab-Linux' // primary demo collection

// Dashboards draw Chart.js charts that animate for about a second after data arrives;
// give those entries a longer settle so the capture shows the finished chart.
const CHART_SETTLE = 1500
const NAV_PANEL = 'nav.nav-rail'
// With `rail: 'expanded'` the Nav Rail is opened before navigation, so dashboard
// charts render once at the final layout. These steps then open its Collections list.
const OPEN_RAIL_COLLECTIONS = [
  ['wait', CHART_SETTLE],
  ['hover', '.nav-rail-item:has-text("Collections")'],
  ['wait', 300],
]
// The Management tab remembers its last sub-panel, so every entry selects one explicitly
const MGMT = panel => ['click', `button.p-togglebutton:has-text("${panel}")`]

// The checklist grid re-renders once after its first rows appear; a settle keeps the
// row from detaching mid-click.
const EXPAND_REVIEW_RESOURCES = [['click', '.review-edit-popover__resources-toggle'], ['wait', 800]]
const selectAssets = n => Array.from({ length: n }, (_, i) => ['click', `.p-datatable tbody tr >> nth=${i} >> .p-checkbox`])
const SELECT_THREE_ASSETS = selectAssets(3)
// Dashboards: select the first row of each grid so the dependent grids below it populate
const SELECT_FIRST_ROWS = [['click', '.p-datatable >> nth=0 >> tbody tr >> nth=0'], ['wait', 800], ['click', '.p-datatable >> nth=1 >> tbody tr >> nth=0'], ['wait', 800]]
// Issues a few unauthenticated API requests so the Log Stream has lines to show
const PING_API = async page => {
  for (const p of ['/api/op/definition', '/api/op/configuration', '/api/stigs']) await page.evaluate(u => fetch(u), p)
}
// Admin pages: a list on the left, the selected row's properties on the right
const SELECT_FIRST_ROW = [['click', '.p-datatable >> nth=0 >> tbody tr >> nth=0'], ['wait', 1000]]
const ADMIN_DETAIL_PANE = '.splitter-panel >> nth=-1'

const OPEN_REVIEW_POPOVER = [
  ['waitFor', 'table tbody tr'],
  ['wait', 800],
  ['click', 'table tbody tr >> nth=2'],
  ['waitFor', '.review-edit-popover'],
]

export const manifest = [
  // ---- user-guide.rst: layout and navigation
  {
    file: 'nav-tree-and-collection-panel.png',
    section: 'user-guide > Overall Organization',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/stigs`,
    rail: 'expanded',
    steps: OPEN_RAIL_COLLECTIONS,
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
    section: 'user-guide > Navigation Tree (now the Nav Rail)',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/stigs`,
    rail: 'expanded',
    steps: OPEN_RAIL_COLLECTIONS,
    clip: NAV_PANEL,
    scale: 2,
  },
  {
    file: 'create-collection-popup.png',
    section: 'user-guide > Collections > +Create Collection',
    user: 'admin',
    route: '/',
    rail: 'expanded',
    steps: [
      ['click', 'button[aria-label="Create New Collection"]'],
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
    file: 'stig-library-selected.png',
    section: 'user-guide > STIG Library Tools > Browse STIGs (STIG selected)',
    user: 'admin',
    route: '/stig-library/RHEL_10_STIG/V1R3',
    steps: [['waitFor', 'table >> nth=1 >> tbody tr'], ['wait', 600], ['click', 'table >> nth=1 >> tbody tr >> nth=1']],
  },
  {
    file: 'stig-compare-tool.png',
    section: 'user-guide > STIG Library Tools > Compare Revisions',
    user: 'admin',
    route: '/stig-library/RHEL_10_STIG/V1R3',
    steps: [
      ['waitFor', 'table tbody tr'],
      ['click', 'label.revision-select:has-text("Compare with") .p-select'],
      ['click', 'li[role="option"]:has-text("V1R2")'],
      ['wait', 1500],
      // second table: the diff rule list (the first is the benchmark list)
      ['click', 'table >> nth=1 >> tbody tr:has-text("RHEL-10-200090")'],
      ['wait', 600],
    ],
  },
  // ---- user-guide.rst: Collection Dashboard
  {
    file: 'collection-panel.png',
    section: 'user-guide > Collection Dashboard',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/stigs`,
    steps: [['wait', CHART_SETTLE], ['click', '.p-datatable >> nth=0 >> tbody tr >> nth=0'], ['wait', 800]],
    settleMs: CHART_SETTLE,
  },
  {
    file: 'collection-panel-overview.png',
    section: 'user-guide > Collection Dashboard > Collection Overview',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/stigs`,
    // Tall enough for the Export Metrics box at the bottom of the sidebar
    viewport: { width: 2560, height: 1560 },
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
      ['click', '.bc-filter .p-multiselect'],
      ['waitFor', '.p-multiselect-overlay, .p-multiselect-panel'],
    ],
    highlights: [{ selector: '.bc-filter', shape: 'box', pad: 6 }],
  },
  {
    file: 'collection-panel-checklist-navigation.png',
    section: 'user-guide > Collection Dashboard > Collection Checklist Navigation',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/stigs`,
    steps: [['wait', CHART_SETTLE], ['click', '.p-datatable >> nth=0 >> tbody tr >> nth=0'], ['wait', 600]],
    highlights: [{ selector: '.p-datatable >> nth=1', shape: 'box', pad: 4 }],
  },
  {
    file: 'collection-panel-assets.png',
    section: 'user-guide > Collection Dashboard > Assets Tab',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/assets`,
    steps: [['wait', CHART_SETTLE], ['click', 'tr:has-text("host-00003")'], ['wait', 600]],
  },
  {
    file: 'collection-panel-labels.png',
    section: 'user-guide > Collection Dashboard > Labels Tab',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/labels`,
    steps: [['wait', CHART_SETTLE], ['click', 'tr:has-text("prod")'], ['wait', 600], ['click', '.p-datatable >> nth=1 >> tbody tr >> nth=0'], ['wait', 600]],
  },
  // ---- user-guide.rst: Meta-Collection Dashboard
  {
    file: 'meta-collection-panel-overview-filters.png',
    section: 'user-guide > Meta-Collection Dashboard > Overview with Filters',
    user: 'admin',
    route: '/collections',
    steps: [
      ['wait', CHART_SETTLE],
      ['click', '.bc-filter .p-multiselect'],
      ['waitFor', 'li[role="option"]'],
      ['click', 'li[role="option"] >> nth=0'],
      ['click', 'li[role="option"] >> nth=1'],
      ['click', 'button:has-text("Apply")'],
      ['wait', CHART_SETTLE],
      ...SELECT_FIRST_ROWS,
    ],
  },
  {
    file: 'meta-collection-dashboard-collections-tab.png',
    section: 'user-guide > Meta-Collection Dashboard > Collections Tab',
    user: 'admin',
    route: '/collections',
    steps: [['wait', CHART_SETTLE], ['click', '.p-datatable >> nth=0 >> tbody tr >> nth=0'], ['wait', 600], ['click', '.p-datatable >> nth=1 >> tbody tr >> nth=0'], ['wait', 600]],
  },
  {
    file: 'meta-collection-dashboard-stigs-tab.png',
    section: 'user-guide > Meta-Collection Dashboard > STIGs Tab',
    user: 'admin',
    route: '/collections',
    steps: [['wait', CHART_SETTLE], ['click', 'button.p-tab:has-text("STIGs")'], ['waitFor', 'tr:has-text("RHEL_10_STIG")'], ['click', 'tr:has-text("RHEL_10_STIG")'], ['wait', 800], ['click', '.p-datatable >> nth=4 >> tbody tr >> nth=0'], ['wait', 800]],
    // Both tabs keep their grids mounted: tables 0-2 are the Collections tab, 3-5 the STIGs tab
  },
  // ---- user-guide.rst: Collection Review Workspace
  {
    file: 'collection-review.png',
    section: 'user-guide > Collection Review Workspace',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/benchmark/RHEL_10_STIG/revision/V1R3`,
    steps: [['waitFor', '.p-datatable >> nth=0 >> tbody tr'], ['waitFor', '.p-datatable >> nth=1 >> tbody tr'], ['wait', 1200]],
  },
  {
    file: 'collection-review-stig-revisions.png',
    section: 'user-guide > Collection Review Workspace > Menu Bar functions',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/benchmark/RHEL_10_STIG/revision/V1R3`,
    steps: [['waitFor', '.p-datatable >> nth=1 >> tbody tr'], ['click', 'text=V1R3 >> nth=0'], ['wait', 600]],
    highlights: [{ selector: '.breadcrumb-select >> nth=-1', shape: 'ellipse', pad: 14 }],
  },
  {
    file: 'collection-workspace-checklist-ages.png',
    section: 'user-guide > Collection Review Workspace > Columns',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/benchmark/RHEL_10_STIG/revision/V1R3`,
    steps: [['waitFor', '.p-datatable >> nth=1 >> tbody tr'], ['click', 'text=Columns >> nth=0'], ['wait', 600]],
    highlights: [{ selector: '.p-multiselect-overlay, .p-multiselect-panel', shape: 'box', pad: 4 }],
  },
  {
    file: 'collection-review-batch-edit.png',
    section: 'user-guide > Collection Review Workspace > Batch Editing',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/benchmark/RHEL_10_STIG/revision/V1R3`,
    steps: [
      ['waitFor', '.p-datatable >> nth=1 >> tbody tr'],
      ['click', '.p-datatable >> nth=1 >> tbody tr >> nth=0 >> .p-checkbox'],
      ['click', '.p-datatable >> nth=1 >> tbody tr >> nth=1 >> .p-checkbox'],
      ['click', 'button:has-text("Batch edit")'],
      ['waitFor', '.p-dialog'],
    ],
  },
  // ---- user-guide.rst: Asset Review Workspace
  // ---- user-guide.rst: Findings Report
  {
    file: 'findings-report.png',
    section: 'user-guide > Findings Report Workspace',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/findings`,
    steps: [['wait', CHART_SETTLE], ['click', '.p-datatable >> nth=0 >> tbody tr >> nth=0'], ['wait', 800]],
  },
  // ---- user-guide.rst: Collection Management Workspace
  {
    file: 'collection-properties.png',
    section: 'user-guide > Collection Management > Collection Properties Panel',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [MGMT('Configuration'), ['wait', 600]],
  },
  {
    file: 'collection-manage-clone-button.png',
    section: 'user-guide > Collection Management > Clone Collection',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [MGMT('Configuration'), ['click', 'button.scrollspy-nav-link:has-text("Actions")'], ['wait', 800]],
    highlights: [{ selector: 'button:has-text("Clone Collection")', shape: 'ellipse', pad: 12 }],
  },
  {
    file: 'collection-manage-clone-options.png',
    section: 'user-guide > Collection Management > Clone Collection (options)',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [MGMT('Configuration'), ['click', 'button.scrollspy-nav-link:has-text("Actions")'], ['wait', 800], ['click', 'button:has-text("Clone Collection")'], ['waitFor', '.p-dialog']],
    clip: '.p-dialog',
    clipPad: 24,
    scale: 2,
  },
  {
    file: 'collection-manage-new-grants-popup.png',
    section: 'user-guide > Collection Management > Grants Tab',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [['click', 'button.p-togglebutton:has-text("Users & Grants")'], ['wait', 800], ['click', 'button:has-text("Add Grants...")'], ['waitFor', '.p-dialog']],
    clip: '.p-dialog',
    clipPad: 24,
    scale: 2,
  },
  {
    file: 'collection-manage-edit-grant.png',
    section: 'user-guide > Collection Management > Grants Tab (edit)',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [['click', 'button.p-togglebutton:has-text("Users & Grants")'], ['wait', 800], ['click', 'tr:has-text("user01") button >> nth=1'], ['waitFor', '.p-dialog']],
    clip: '.p-dialog',
    clipPad: 24,
    scale: 2,
  },
  {
    file: 'collection-manage-acl-popup.png',
    section: 'user-guide > Collection Management > Grants Tab (ACL)',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [['click', 'button.p-togglebutton:has-text("Users & Grants")'], ['wait', 800], ['click', 'tr:has-text("user10") button >> nth=0'], ['waitFor', '.p-dialog']],
    clip: '.p-dialog',
    clipPad: 24,
    scale: 2,
  },
  {
    file: 'collection-manage-effective-access.png',
    section: 'user-guide > Collection Management > Users Tab',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [['click', 'button.p-togglebutton:has-text("Users & Grants")'], ['wait', 800], ['click', 'button.scrollspy-nav-link:has-text("Effective Users")'], ['wait', 800]],
  },
  {
    file: 'collection-manage-review-fields.png',
    section: 'user-guide > Collection Management > Collection Settings Tab',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [MGMT('Configuration'), ['click', 'button.scrollspy-nav-link:has-text("Review Settings")'], ['wait', 800]],
  },
  {
    file: 'collection-manage-review-import-options.png',
    section: 'user-guide > Collection Management > Import Options',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [MGMT('Configuration'), ['click', 'button.scrollspy-nav-link:has-text("Import Options")'], ['wait', 800]],
  },
  {
    file: 'collection-manage-labels.png',
    section: 'user-guide > Collection Management > Labels Tab',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [['click', 'button.p-togglebutton:has-text("Labels")'], ['wait', 800]],
  },
  {
    file: 'collection-manage-new-label.png',
    section: 'user-guide > Collection Management > Labels Tab (create)',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [['click', 'button.p-togglebutton:has-text("Labels")'], ['wait', 800], ['click', 'button.action-btn:has-text("Create")'], ['waitFor', '.p-dialog']],
    clip: '.p-dialog',
    clipPad: 24,
    scale: 2,
  },
  {
    file: 'collection-manage-tag-assets-modal.png',
    section: 'user-guide > Collection Management > Labels Tab (tag assets)',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [['click', 'button.p-togglebutton:has-text("Labels")'], ['wait', 800], ['click', '.p-datatable tbody tr >> nth=0 >> .p-checkbox'], ['click', 'button.action-btn:has-text("Tag Assets")'], ['waitFor', '.p-dialog']],
    clip: '.p-dialog',
    clipPad: 24,
    scale: 2,
  },
  {
    file: 'collection-manage-tasks.png',
    section: 'user-guide > Collection Management > Review Aging',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [MGMT('Configuration'), ['click', 'button.scrollspy-nav-link:has-text("Actions")'], ['wait', 600], ['scrollTo', 'button:has-text("New Rule")'], ['wait', 600]],
  },
  {
    file: 'collection-manage-review-aging-rule.png',
    section: 'user-guide > Collection Management > Review Aging (rule)',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [MGMT('Configuration'), ['click', 'button.scrollspy-nav-link:has-text("Actions")'], ['wait', 600], ['click', 'button:has-text("New Rule")'], ['waitFor', '.p-dialog']],
    clip: '.p-dialog',
    clipPad: 24,
    scale: 2,
  },
  {
    file: 'assets-panel-toolbar.png',
    section: 'user-guide > Collection Management > Assets Panel',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [['click', 'button.p-togglebutton:has-text("Assets")'], ['wait', 800]],
    clip: '.assets-toolbar',
    clipPad: 8,
    scale: 2,
  },
  {
    file: 'collection-manage-asset-panel-label-filtering.png',
    section: 'user-guide > Collection Management > Assets Panel (label filter)',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [['click', 'button.p-togglebutton:has-text("Assets")'], ['wait', 800], ['click', '.grid-filter-btn'], ['wait', 600]],
  },
  {
    file: 'collection-manage-asset-label-edit.png',
    section: 'user-guide > Collection Management > Assets Panel (asset properties)',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [['click', 'button.p-togglebutton:has-text("Assets")'], ['wait', 800], ['click', 'tr:has-text("host-00003") >> button.row-edit-btn'], ['waitFor', '.p-dialog']],
    clip: '.p-dialog',
    clipPad: 24,
    scale: 2,
  },
  {
    file: 'collection-manage-csv-batch-create.png',
    section: 'user-guide > Collection Management > Create Asset Batch',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [['click', 'button.p-togglebutton:has-text("Assets")'], ['wait', 800]],
    highlights: [{ selector: 'button:has-text("Import Assets CSV")', shape: 'ellipse', pad: 10 }],
    clip: '.assets-toolbar',
    clipPad: 40,
    scale: 2,
  },
  {
    file: 'collection-manage-asset-csv-importer.png',
    section: 'user-guide > Collection Management > Create Asset Batch (importer)',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [['click', 'button.p-togglebutton:has-text("Assets")'], ['wait', 800], ['upload', 'button:has-text("Import Assets CSV")', '../user-guide/Stig-Manager-Asset-Batch-Import.csv'], ['waitFor', '.p-dialog'], ['wait', 800]],
    clip: '.p-dialog',
    clipPad: 24,
    scale: 2,
  },
  {
    file: 'collection-manage-results-export-assets-csv.png',
    section: 'user-guide > Collection Management > Export Assets CSV',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [['click', 'button.p-togglebutton:has-text("Assets")'], ['wait', 800]],
    highlights: [{ selector: 'button:has-text("Export Assets CSV")', shape: 'ellipse', pad: 10 }],
    clip: '.assets-toolbar',
    clipPad: 40,
    scale: 2,
  },
  {
    file: 'collection-builder-files.png',
    section: 'user-guide > Collection Management > Collection Builder',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [['click', 'button.p-togglebutton:has-text("Assets")'], ['wait', 800], ['click', 'button:has-text("Import CKL(B) or XCCDF")'], ['waitFor', '.p-dialog']],
    clip: '.p-dialog',
    clipPad: 24,
    scale: 2,
  },
  {
    file: 'collection-manage-results-export-asset-collection.png',
    section: 'user-guide > Collection Management > Export Results to Another Collection',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [['click', 'button.p-togglebutton:has-text("Assets")'], ['wait', 800], ...selectAssets(20), ['click', 'button:has-text("Export results")'], ['waitFor', '.p-dialog'], ['click', '.p-dialog label:has-text("Collection")'], ['wait', 300]],
    clip: '.p-dialog',
    clipPad: 24,
    scale: 2,
  },
  {
    file: 'collection-manage-results-export-asset-archive.png',
    section: 'user-guide > Collection Management > Export Results as CKL or XCCDF Archive',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [['click', 'button.p-togglebutton:has-text("Assets")'], ['wait', 800], ...selectAssets(20), ['click', 'button:has-text("Export results")'], ['waitFor', '.p-dialog']],
    clip: '.p-dialog',
    clipPad: 24,
    scale: 2,
  },
  {
    file: 'transfer-asset.png',
    section: 'user-guide > Collection Management > Transfer Asset',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [['click', 'button.p-togglebutton:has-text("Assets")'], ['wait', 800], ...SELECT_THREE_ASSETS, ['click', 'button.transfer-trigger'], ['wait', 600]],
  },
  {
    file: 'stigs-panel.png',
    section: 'user-guide > Collection Management > STIGs Panel',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [['click', 'button.p-togglebutton:has-text("STIGs")'], ['wait', 800]],
  },
  {
    file: 'stig-assignments.png',
    section: 'user-guide > Collection Management > Assign STIG',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [['click', 'button.p-togglebutton:has-text("STIGs")'], ['wait', 800], ['click', 'button.action-btn:has-text("Assign")'], ['waitFor', '.p-dialog'], ['click', '.p-dialog .selection-select >> nth=0'], ['click', 'li[role="option"]:has-text("RHEL_10_STIG")'], ['wait', 1200]],
    clip: '.p-dialog',
    clipPad: 24,
    scale: 2,
  },
  {
    file: 'collection-manage-revision-pinning.png',
    section: 'user-guide > Collection Management > Set a Default STIG Revision',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [['click', 'button.p-togglebutton:has-text("STIGs")'], ['wait', 800], ['click', 'tr:has-text("RHEL_10_STIG") >> .p-checkbox'], ['click', 'button.action-btn:has-text("Modify")'], ['waitFor', '.p-dialog'], ['wait', 500], ['press', 'Escape'], ['wait', 500], ['click', 'button.action-btn:has-text("Modify")'], ['waitFor', '.p-dialog'], ['wait', 1500], ['click', '.p-dialog .selection-select >> nth=1'], ['wait', 600]],
    // Opened twice: the first open of the Modify dialog mounts it already visible, so its
    // visibility watcher never loads the selected STIG (client bug, reported 2026-11-04)
    clip: '.p-dialog',
    clipPad: 24,
    scale: 2,
  },
  // ---- 2x samples of text-heavy views (not yet placed in the docs)
  // ---- other trial entries
  {
    file: 'meta-collection-nav.png',
    section: 'user-guide > Meta-Collection Dashboard (Nav Rail entry)',
    user: 'admin',
    route: '/',
    rail: 'expanded',
    steps: OPEN_RAIL_COLLECTIONS,
    clip: NAV_PANEL,
    scale: 2,
    highlights: [{ selector: 'a.collection-list-link:has-text("Collections Dashboard")', shape: 'box', pad: 4 }],
  },
  {
    file: 'meta-collection-dashboard.png',
    section: 'user-guide > Meta-Collection Dashboard',
    user: 'admin',
    route: '/collections',
    steps: [['wait', CHART_SETTLE], ...SELECT_FIRST_ROWS],
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
    route: l => l.assetReviewRoute(C, 'host-00003', 'RHEL_10_STIG'),
    // V-280944 has a saved review, so Review Resources has history to show
    steps: [['waitFor', 'table tbody tr'], ['wait', 800], ['click', 'tr:has-text("V-280944")'], ['waitFor', '.review-edit-popover'], ...EXPAND_REVIEW_RESOURCES],
  },
  {
    file: 'review-attributions-panel.png',
    section: 'user-guide > Asset Review Workspace > Review Panel',
    user: 'admin',
    route: l => l.assetReviewRoute(C, 'host-00003', 'RHEL_10_STIG'),
    // V-280944 has a detail, a comment, and an accepted status
    steps: [['waitFor', 'table tbody tr'], ['wait', 800], ['click', 'tr:has-text("V-280944")'], ['waitFor', '.review-edit-popover']],
    highlights: [{ selector: '.review-edit-popover__attributions', shape: 'ellipse', pad: 10 }],
    clip: '.review-edit-popover',
    clipPad: 40,
    scale: 2,
  },
  {
    file: 'asset-review-autoresult.png',
    section: 'user-guide > Asset Review Workspace > Result Engine',
    user: 'admin',
    route: l => l.assetReviewRoute(C, 'host-00001-override', 'RHEL_10_STIG'),
    // V-280936 was imported from Evaluate-STIG without an override
    steps: [['waitFor', 'table tbody tr'], ['wait', 800], ['click', 'tr:has-text("V-280936")'], ['waitFor', '.review-edit-popover'], ['hover', '.result-engine-badges__badge--engine'], ['wait', 600]],
    highlights: [{ selector: '.result-engine-badges', shape: 'ellipse', pad: 10 }],
  },
  {
    file: 'asset-review-autoresult-with-override.png',
    section: 'user-guide > Asset Review Workspace > Result Engine (override)',
    user: 'admin',
    route: l => l.assetReviewRoute(C, 'host-00001-override', 'RHEL_10_STIG'),
    // V-281287 carries an answer-file override of the engine result
    steps: [['waitFor', 'table tbody tr'], ['wait', 800], ['fill', '.checklist-grid__header-search-input input, input.checklist-grid__header-search-input', 'V-281287'], ['wait', 800], ['click', 'tr:has-text("V-281287")'], ['waitFor', '.review-edit-popover'], ['hover', '.result-engine-badges__badge--override'], ['wait', 600]],
    clip: '.review-edit-popover',
    clipPad: 120,
    scale: 2,
  },
  {
    file: 'asset-review-writeable.png',
    section: 'user-guide > Asset Review Workspace > Checklist Panel',
    user: 'admin',
    route: l => l.assetReviewRoute(C, 'host-00003', 'RHEL_10_STIG'),
    steps: [['waitFor', 'table tbody tr']],
    clip: 'text=Writable',
    clipPad: 40,
    scale: 2,
  },
  // ---- admin-guide.rst (list on the left, properties for the selected row on the right)
  {
    file: 'admin-collections.png',
    section: 'admin-guide > Collections Admin Panel',
    user: 'admin',
    route: '/app-management/collections',
    steps: SELECT_FIRST_ROW,
  },
  {
    file: 'admin-users.png',
    section: 'admin-guide > Users Admin Panel',
    user: 'admin',
    route: '/app-management/users',
    steps: SELECT_FIRST_ROW,
  },
  {
    file: 'admin-user-properties.png',
    section: 'admin-guide > Users Admin Panel > User Properties',
    user: 'admin',
    route: '/app-management/users',
    steps: SELECT_FIRST_ROW,
    clip: ADMIN_DETAIL_PANE,
    clipPad: 8,
    scale: 2,
  },
  {
    file: 'admin-user-groups.png',
    section: 'admin-guide > User Groups Admin Panel',
    user: 'admin',
    route: '/app-management/user-groups',
    steps: SELECT_FIRST_ROW,
  },
  {
    file: 'admin-user-groups-popup.png',
    section: 'admin-guide > User Groups Admin Panel > Users tab',
    user: 'admin',
    route: '/app-management/user-groups',
    steps: SELECT_FIRST_ROW,
    clip: ADMIN_DETAIL_PANE,
    clipPad: 8,
    scale: 2,
  },
  {
    file: 'admin-user-groups-popup-grants.png',
    section: 'admin-guide > User Groups Admin Panel > Grants tab',
    user: 'admin',
    route: '/app-management/user-groups',
    steps: [...SELECT_FIRST_ROW, ['click', '[role="tab"]:has-text("Grants")'], ['wait', 800]],
    clip: ADMIN_DETAIL_PANE,
    clipPad: 8,
    scale: 2,
  },
  {
    file: 'admin-stigs.png',
    section: 'admin-guide > STIGs Admin Panel',
    user: 'admin',
    route: '/app-management/stigs',
    steps: SELECT_FIRST_ROW,
  },
  {
    file: 'admin-service-jobs.png',
    section: 'admin-guide > Service Jobs Admin Panel',
    user: 'admin',
    route: '/app-management/service-jobs',
    steps: SELECT_FIRST_ROW,
  },
  {
    file: 'admin-service-job-properties.png',
    section: 'admin-guide > Service Jobs Admin Panel > Job Properties',
    user: 'admin',
    route: '/app-management/service-jobs',
    steps: [...SELECT_FIRST_ROW, ['click', 'button:has(.pi-pencil) >> nth=0'], ['waitFor', '.p-dialog'], ['wait', 600]],
    clip: '.p-dialog',
    clipPad: 24,
    scale: 2,
  },
  {
    file: 'admin-app-info.png',
    section: 'admin-guide > Application Info',
    user: 'admin',
    route: '/app-management/app-info',
    settleMs: 2500,
  },
  {
    file: 'admin-log-stream.png',
    section: 'admin-guide > Log Stream',
    user: 'admin',
    route: '/app-management/log-stream',
    // Start streaming, then make a few API calls from the page so lines arrive
    steps: [['wait', 1500], ['click', '.log-toolbar button:has-text("Stream")'], ['wait', 1500], ['run', PING_API], ['wait', 3000]],
  },
  {
    file: 'admin-log-stream-filter.png',
    section: 'admin-guide > Log Stream > Filter options',
    user: 'admin',
    route: '/app-management/log-stream',
    // Filters are enabled only while streaming
    steps: [['wait', 2000], ['click', '.log-toolbar button:has-text("Stream")'], ['wait', 4000], ['click', 'button[aria-label="Stream filters"]'], ['waitFor', '.log-filter'], ['wait', 400]],
    clip: '.p-popover',
    clipPad: 24,
    scale: 2,
  },
  {
    file: 'admin-app-data.png',
    section: 'admin-guide > Export/Import Data',
    user: 'admin',
    route: '/app-management/transfer',
  },
  // ---- admin-quickstart.rst
  {
    file: 'asset-review-stig-revisions.png',
    section: 'admin-quickstart > STIG Revision Selection',
    user: 'admin',
    route: l => l.assetReviewRoute(C, 'host-00003', 'RHEL_10_STIG'),
    steps: [['waitFor', 'table tbody tr'], ['click', '.breadcrumb-select >> nth=-1'], ['wait', 600]],
    highlights: [{ selector: '.breadcrumb-select >> nth=-1', shape: 'ellipse', pad: 14 }],
  },
  {
    file: 'user-admin-prereg-button.png',
    section: 'admin-quickstart > Pre-register User button',
    user: 'admin',
    route: '/app-management/users',
    steps: [['wait', 800]],
    highlights: [{ selector: 'button:has(.pi-user-plus)', shape: 'ellipse', pad: 12 }],
    clip: 'button:has(.pi-user-plus) >> xpath=..',
    clipPad: 40,
    scale: 2,
  },
  {
    file: 'user-admin-prereg-popup.png',
    section: 'admin-quickstart > Pre-register User popup',
    user: 'admin',
    route: '/app-management/users',
    steps: [['wait', 800], ['click', 'button:has(.pi-user-plus)'], ['waitFor', '.p-dialog']],
    clip: '.p-dialog',
    clipPad: 24,
    scale: 2,
  },
  // ---- user-quickstart.rst
  {
    file: 'collection-manage-asset-create-button.png',
    section: 'user-quickstart > Create Asset button',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [MGMT('Assets'), ['wait', 800]],
    highlights: [{ selector: '.assets-toolbar button:has-text("Create")', shape: 'ellipse', pad: 10 }],
    clip: '.assets-toolbar',
    clipPad: 40,
    scale: 2,
  },
  {
    file: 'create-asset.png',
    section: 'user-quickstart > Asset Creation Popup (was AssetCreationPopup.png)',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [MGMT('Assets'), ['wait', 800], ['click', '.assets-toolbar button:has-text("Create")'], ['waitFor', '.p-dialog'], ['wait', 600]],
    clip: '.p-dialog',
    clipPad: 24,
    scale: 2,
  },
  {
    file: 'collection-manage-grants.png',
    section: 'user-quickstart > Add Collection Grant',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [MGMT('Users & Grants'), ['wait', 800]],
    highlights: [{ selector: 'button:has-text("Add Grants...")', shape: 'ellipse', pad: 10 }],
  },
  {
    file: 'collection-manage-populated.png',
    section: 'user-quickstart > Collection Management with Assets (was CollectionConfig_Populated.png)',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [MGMT('Assets'), ['wait', 800]],
  },
  {
    file: 'collection-review-being-edited.png',
    section: 'user-quickstart > Editing in the Collection Review panel',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/benchmark/RHEL_10_STIG/revision/V1R3`,
    steps: [['waitFor', '.p-datatable >> nth=0 >> tbody tr'], ['waitFor', '.p-datatable >> nth=1 >> tbody tr'], ['wait', 1200], ['click', '.p-datatable >> nth=1 >> tbody tr >> nth=0'], ['waitFor', '.review-edit-popover']],
  },
  // ---- roles-and-access.rst
  {
    file: 'collection-manage-grants-edit-acl.png',
    section: 'roles-and-access > Edit ACL button (was collection-manage-grants-w-edit-acl-highlighted-trimmed.png)',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [MGMT('Users & Grants'), ['wait', 800]],
    highlights: [{ selector: 'tr:has-text("user10") button >> nth=0', shape: 'ellipse', pad: 12 }],
    clip: '.p-datatable >> nth=0',
    clipPad: 24,
    scale: 2,
  },
  {
    file: 'collection-manage-acl-popup-collection-selected.png',
    section: 'roles-and-access > ACL popup, Whole Collection with Read Only access',
    user: 'admin',
    route: l => `/collection/${l.collectionId(C)}/management`,
    steps: [MGMT('Users & Grants'), ['wait', 800], ['click', 'tr:has-text("user10") button >> nth=0'], ['waitFor', '.p-dialog'], ['wait', 600], ['click', '.p-dialog button:has-text("Add")'], ['waitFor', '.p-menu'], ['wait', 300]],
    highlights: [{ selector: '.p-menu-item:has-text("Read Only")', shape: 'ellipse', pad: 10 }],
    clip: '.p-dialog',
    clipPad: 24,
    scale: 2,
  },
]
