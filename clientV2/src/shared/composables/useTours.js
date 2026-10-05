import { readonly, ref } from 'vue'

// Bumped whenever the tour content changes enough that users who have already
// seen it should be shown it again. Compared against webPreferences.lastTour.
export const TOUR_DATE = '2026-10-04'

const startRequests = ref(0)

// Lets any view ask the app-level OrientationTour to run.
export function useOrientationTour() {
  function requestStart() {
    startRequests.value += 1
  }

  return {
    startRequests: readonly(startRequests),
    requestStart,
  }
}
