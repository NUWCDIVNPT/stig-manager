const baseUrl = import.meta.env.BASE_URL

export const Sources = [
  {
    date: '2026-02-28',
    header: 'Enhanced Dashboard Metrics',
    body: `
    <p>The Collection Dashboard now includes expanded metrics with trend indicators,
    giving you a clearer picture of your compliance posture over time.</p>
    <p>New visualizations help identify STIGs that need the most attention.</p>

    <p><img src="${baseUrl}whatsnew/image.png" width=500/></p>`,
  },
  {
    date: '2026-02-14',
    header: 'Bulk Review Import Improvements',
    body: `
    <p>Importing CKL and XCCDF results is now significantly faster with parallel processing.
    You'll also see more detailed progress reporting during imports.</p>
    <p>Added support for importing CKLB format files directly from STIG Viewer 3.</p>

    <p><img src="${baseUrl}whatsnew/image.png" width=500/></p>`,
  },
  {
    date: '2026-01-30',
    header: 'Collection Labels and Filtering',
    body: `
    <p>You can now create and assign labels to assets within a Collection,
    making it easier to organize and filter large sets of assets.</p>
    <p>Labels are color-coded and can be used to quickly filter the Assets grid.</p>

    <p><img src="${baseUrl}whatsnew/image.png" width=500/></p>`,
  },
  {
    date: '2026-01-15',
    header: 'User Group Management',
    body: `
    <p>Application managers can now create User Groups and assign Collection grants
    to the group rather than to individual users. This simplifies access management
    for organizations with many users.</p>`,
  },
  {
    date: '2025-06-20',
    header: 'Improved Review Workspace',
    body: `
    <p>The Review workspace has been redesigned for a smoother workflow.
    Navigate between rules with keyboard shortcuts and see the full
    STIG check content alongside your review.</p>
    <p>Auto-save ensures your work is never lost.</p>

    <p><img src="${baseUrl}whatsnew/image.png" width=500/></p>`,
  },
  {
    date: '2025-01-01',
    header: 'New Vue.js Client Launch',
    body: `
    <p>Welcome to the new STIG Manager client! Built with Vue.js and PrimeVue,
    the new interface is faster, more responsive, and designed for modern workflows.</p>
    <p>All the features you relied on in the previous client are here, with a fresh look
    and improved usability throughout.</p>`,
  },
]
