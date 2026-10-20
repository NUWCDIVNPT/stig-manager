// Tours shown by TourHost, keyed by tour id.
//
// date:  bumped whenever the tour changes enough that users who have already
//        seen it should be shown it again. Compared against
//        webPreferences.tours[id].
// steps: each spotlights the element tagged data-tour="<target>". Steps whose
//        target is not on screen are skipped.
//   placement:  where the card sits relative to the target: 'right' (default),
//               'left', 'below-end' or 'center' (over the target).
//   expandRail: holds the nav rail open while the step is showing.
//   clickTarget: Next clicks the target before moving on, so a step can walk
//               the user through a link.
//   route:      navigates there when the step opens. The step is kept even
//               though its target is not on screen when the tour starts.
export const TOURS = {
  shell: {
    date: '2026-10-04',
    steps: [
      {
        target: 'nav-rail',
        title: 'Navigation moved to the left rail',
        body: 'The navigation tree from the previous interface is now this rail. It is open for this tour; the arrow at the top expands it for labels and your Collection list, or collapses it to icons.',
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
        body: 'Browse every STIG installed on this server and compare revisions.',
        expandRail: true,
      },
      {
        target: 'nav-item-whats-new',
        title: 'What\'s New',
        body: 'Release notes and feature announcements, formerly under Interface in the navigation tree.',
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
        body: 'Quick links back to workspaces you have opened recently.',
        expandRail: true,
      },
      {
        target: 'user-menu',
        title: 'Your account moved to the top right',
        body: 'Your username and Sign out are under the user icon here, instead of at the top of the navigation tree.',
        placement: 'below-end',
      },
      {
        target: 'nav-collections-dashboard',
        title: 'Collections Dashboard',
        body: 'The first entry in your Collection list opens a dashboard across all of your Collections. Next opens it.',
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
  assetReview: {
    date: '2026-10-05',
    steps: [
      {
        target: 'asset-review-checklist',
        title: 'Checklist',
        body: 'Every Rule in this STIG for the Asset, with its Review. Select a row to work on that Rule.',
        placement: 'center',
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
