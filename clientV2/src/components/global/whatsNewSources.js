const baseUrl = import.meta.env.BASE_URL

export const Sources = [
  {
    date: '2026-10-15',
    header: 'STIG Manager New Client Preview',
    body: `
    <p>Welcome to the preview of the next STIG Manager web interface. It is a redesigned client built on the same API,
    so your Collections, Assets, and Reviews are the same in both interfaces and work done in one appears in the other.</p>
    <p>The Collection workspace puts the Dashboard, STIGs, Assets, Labels, Findings, and Management views one click apart,
    and every grid has search, column filters, column selection, density controls, and CSV export built in.</p>
    <p>New here? <a href="#" data-tour-start="shell"><b>Take the tour</b></a> for a quick walk through the layout.</p>
    <p>Your input is welcome. Please share feedback, problems, or suggestions by opening an issue on our
    <a target="_blank" href="https://github.com/NUWCDIVNPT/stig-manager/issues">GitHub Issues page</a>.</p>

    <p><img src="${baseUrl}whatsnew/2026-10-15-new-client-collection-dashboard.png" width=900 loading="lazy"/></p>`,
  },
  {
    date: '2026-09-15',
    header: 'Bookmarkable Collections and Views',
    body: `
    <p>Every view in the new interface has its own URL. A Collection tab, an Asset checklist, a Collection Review for a STIG,
    or a STIG in the STIG Library can be bookmarked, opened in a new tab, or sent to a colleague, and the link opens that
    exact view.</p>
    <p>The browser Back and Forward buttons move between views as you would expect, and the breadcrumb at the top of the
    page always shows where you are and offers a quick way back up.</p>

    <p><img src="${baseUrl}whatsnew/2026-09-15-bookmarkable-url.png" width=900 loading="lazy"/></p>`,
  },
  {
    date: '2026-08-15',
    header: 'Pop-up Review Interface',
    body: `
    <p>Selecting a Rule in a checklist opens the Review editor in a pop-up anchored to that row, so the Result, Detail,
    Comment, and Status controls are right where you are working instead of in a separate panel.</p>
    <p>The pop-up stays open as you move between Rules, and the Review Resources section expands to show the Review's
    History, the same Rule on other Assets, and Status text without leaving the checklist.</p>

    <p><img src="${baseUrl}whatsnew/2026-08-15-review-popup.png" width=900 loading="lazy"/></p>`,
  },
  {
    date: '2026-07-15',
    header: 'Label Filters for Collection Review',
    body: `
    <p>The Label filter in the breadcrumb now applies to Collection Review as well as the Collection Dashboard.
    Pick one or more Labels and the checklist's result and status counts, the Reviews grid, and the Asset totals
    describe only the Assets that carry those Labels.</p>
    <p>The filter travels with you. Opening a STIG from a filtered Dashboard carries the same Labels into
    Collection Review, and the filter is part of the URL, so a bookmarked or shared link reopens the same filtered view.</p>

    <p><img src="${baseUrl}whatsnew/2026-07-15-label-filter-collection-review.png" width=900 loading="lazy"/></p>`,
  },
  {
    date: '2026-06-15',
    header: 'Entire Checklist in One View',
    body: `
    <p>The Asset Review workspace gives the checklist the full height of the page. Each row shows the Rule's Result,
    Detail, Comment, Status, and age, so you can scan an entire checklist without opening each Review.</p>
    <p>The Rule content for the selected Rule is shown in a resizable panel alongside the checklist, and the footer keeps a
    running count of results and statuses as you work.</p>

    <p><img src="${baseUrl}whatsnew/2026-06-15-asset-review-full-checklist.png" width=900 loading="lazy"/></p>`,
  },
]
