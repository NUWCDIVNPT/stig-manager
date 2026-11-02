// Tours shown by TourHost, keyed by tour id.
//
// date:  bumped whenever the tour changes enough that users who have already
//        seen it should be shown it again. Compared against
//        webPreferences.tours[id].
// steps: each spotlights the element tagged data-tour="<target>". Steps whose
//        target is not on screen are skipped.
//   placement:  where the card sits relative to the target: 'right' (default),
//               'left', 'below', 'below-end' or 'center' (over the target).
//   expandRail: holds the nav rail open while the step is showing.
//   clickTarget: Next clicks the target before moving on, so a step can walk
//               the user through a link or open an editor.
//   route:      navigates there when the step opens. The step is kept even
//               though its target is not on screen when the tour starts.
//   deferred:   the step is kept even though its target is not on screen when
//               the tour starts, because the previous step's click brings it
//               on screen (a popup, say).
export const TOURS = {
  shell: {
    date: '2026-10-04',
    steps: [
      {
        target: 'nav-rail',
        title: 'Navigation rail',
        body: 'Everything in the app is reached from this rail. The arrow at the top expands it for section labels and your Collection list, or collapses it to icons.',
        expandRail: true,
      },
      {
        target: 'nav-item-home',
        title: 'Home',
        body: 'Returns to the landing page from anywhere in the app.',
        expandRail: true,
      },
      {
        target: 'nav-item-collections',
        title: 'Collections',
        body: 'Your Collections live here. With the rail expanded they list inline; collapsed, this opens a searchable popover.',
        expandRail: true,
      },
      {
        target: 'nav-item-library',
        title: 'STIG Library',
        body: 'Browse every STIG installed on this system and compare revisions.',
        expandRail: true,
      },
      {
        target: 'nav-item-whats-new',
        title: 'What\'s New',
        body: 'Release notes and feature announcements.',
        expandRail: true,
      },
      {
        target: 'nav-item-admin',
        title: 'Admin',
        body: 'Application Management workspaces: Users, User Groups, STIG Benchmarks, Service Jobs, and more.',
        expandRail: true,
      },
      {
        target: 'nav-recent',
        title: 'Recent Views',
        body: 'Quick links back to the workspaces you have opened most recently.',
        expandRail: true,
      },
      {
        target: 'user-menu',
        title: 'Your account',
        body: 'Your username and Sign out are under the user icon here.',
        placement: 'below-end',
      },
      {
        target: 'nav-collections-dashboard',
        title: 'Collections Dashboard',
        body: 'The first entry in your Collection list opens a dashboard across all of your Collections.',
        expandRail: true,
        clickTarget: true,
      },
      {
        target: 'meta-dashboard',
        title: 'Collections Dashboard',
        body: 'Metrics across every Collection you can access, with the Collections and STIGs grids beside them. Select Collections to narrow the view, or click one to open it.',
        placement: 'center',
        route: '/collections',
      },
    ],
  },
  collection: {
    date: '2026-11-02',
    steps: [
      {
        target: 'collection-dashboard',
        title: 'Collection Dashboard',
        body: 'Metrics for this Collection: assessment progress, result and status counts, and Review age. Collapse the panel with the arrow when you need the full width for the grids.',
      },
      {
        target: 'collection-tabs',
        title: 'Collection views',
        body: 'The STIGs, Assets, and Labels grids, and the Findings report, are tabs here, one click apart.',
        placement: 'below',
      },
      {
        target: 'collection-tab-management',
        title: 'Management',
        body: 'Owners and Managers configure the Collection from this tab: Assets, STIG assignments, Labels, Grants, and settings.',
        placement: 'below',
      },
      {
        target: 'label-filter',
        title: 'Label filter',
        body: 'Pick one or more Labels here and the Dashboard, the grids, and Findings describe only the Assets that carry them. The filter stays with you when you open a STIG in Collection Review, and is part of the URL so a bookmark reopens the same filtered view.',
        placement: 'below',
      },
    ],
  },
  collectionReview: {
    date: '2026-11-02',
    steps: [
      {
        target: 'label-filter',
        title: 'Label filter',
        body: 'Collection Review is filtered by Label too. A filter picked on the Collection Dashboard carries into this view, and you can change it here at any time.',
        placement: 'below',
      },
      {
        target: 'collection-review-checklist',
        title: 'Checklist',
        body: 'Every Rule in this STIG, with result and status counts across the Assets that match the Label filter. Select a Rule to work on it.',
        placement: 'center',
      },
      {
        target: 'collection-review-reviews',
        title: 'Reviews',
        body: 'The Review of the selected Rule on each Asset. Click a row to edit that Review in a pop-up right where you are, or select several rows to set their results or statuses together.',
        placement: 'center',
      },
      {
        target: 'collection-review-rule',
        title: 'Rule content',
        body: 'The check and fix text for the selected Rule stays open here beside the grids.',
        placement: 'left',
      },
    ],
  },
  assetReview: {
    date: '2026-11-02',
    steps: [
      {
        target: 'asset-review-checklist',
        title: 'Checklist',
        body: 'Every Rule in this STIG for the Asset, with its Review. Select a row to work on that Rule.',
        placement: 'center',
      },
      {
        target: 'breadcrumb',
        title: 'Where you are',
        body: 'The breadcrumb shows the Collection, Asset, STIG, and revision you are viewing. The STIG and revision are drop-downs, so you can switch to another checklist on this Asset without leaving the page.',
        placement: 'below',
      },
      {
        target: 'breadcrumb',
        title: 'Bookmark this view',
        body: 'The address bar always reflects this exact checklist. Bookmark it, open it in a new tab, or send the link to a colleague and it opens right here.',
        placement: 'below',
      },
      {
        target: 'asset-review-row',
        title: 'Edit a Review',
        body: 'Click a row to open the Review editor beside it. Next will open the first row for you.',
        clickTarget: true,
      },
      {
        target: 'review-popover',
        title: 'Review editor',
        body: 'Result, Detail, Comment, and Status are edited in this pop-up, which stays open as you move between rows. Review Resources below it show the Review\'s History and the same Rule on other Assets.',
        deferred: true,
      },
      {
        target: 'asset-review-rule',
        title: 'Rule content',
        body: 'The check and fix text for the selected Rule stays open here beside the checklist.',
        placement: 'left',
      },
    ],
  },
}
