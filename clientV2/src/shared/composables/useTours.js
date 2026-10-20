import { readonly, ref } from 'vue'

const request = ref(null)
const navRailExpanded = ref(false)

// Lets any view ask the app-level TourHost to run a tour from
// components/global/tours.js.
export function useTours() {
  // Runs the tour whether or not the user has seen it.
  function startTour(id) {
    request.value = { id, onlyIfUnseen: false }
  }

  // Runs the tour only if the user has not seen its current version. Views
  // call this once they have rendered the elements their tour points at.
  function offerTour(id) {
    request.value = { id, onlyIfUnseen: true }
  }

  function takeRequest() {
    const pending = request.value
    request.value = null
    return pending
  }

  function setNavRailExpanded(value) {
    navRailExpanded.value = value
  }

  return {
    request: readonly(request),
    // True while a tour step needs the nav rail open, whatever the user's own setting.
    navRailExpanded: readonly(navRailExpanded),
    startTour,
    offerTour,
    takeRequest,
    setNavRailExpanded,
  }
}
