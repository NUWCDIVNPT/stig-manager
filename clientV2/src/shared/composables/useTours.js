import { computed, readonly, ref, watch } from 'vue'
import { TOURS } from '../../components/global/tours.js'
import { useWebPreferences } from './useWebPreferences.js'

const request = ref(null)
const navRailExpanded = ref(false)

// Lets any view ask the app-level TourHost to run a tour from
// components/global/tours.js, and owns what webPreferences.tours records:
// the version date of each tour the user has seen.
export function useTours() {
  const { preferences, patchPreferences } = useWebPreferences()

  // Runs the tour whether or not the user has seen it.
  function startTour(id) {
    request.value = { id, onlyIfUnseen: false }
  }

  // Runs the tour only if the user has not seen its current version. Views
  // call this once they have rendered the elements their tour points at.
  function offerTour(id) {
    request.value = { id, onlyIfUnseen: true }
  }

  // Offers the tour once `ready()` first turns true, so a view can declare
  // what its tour points at instead of wiring the watch itself.
  function offerTourWhen(id, ready) {
    const stop = watch(ready, (isReady) => {
      if (isReady) {
        offerTour(id)
        stop()
      }
    }, { immediate: true })
  }

  function takeRequest() {
    const pending = request.value
    request.value = null
    return pending
  }

  function setNavRailExpanded(value) {
    navRailExpanded.value = value
  }

  // Every tour id with a recorded date, including ids no longer defined.
  const recordedTourIds = computed(() => Object.keys(preferences.value.tours ?? {}))

  // A tour counts as seen until its date is bumped past the recorded one.
  function hasSeen(id) {
    return (preferences.value.tours?.[id] ?? '') >= TOURS[id].date
  }

  function markSeen(id) {
    return patchPreferences({ tours: { [id]: TOURS[id].date } })
  }

  // A null date drops the key from the merge-patch, so the tour is offered
  // again the next time its view opens.
  function forget(ids) {
    return patchPreferences({ tours: Object.fromEntries(ids.map(id => [id, null])) })
  }

  return {
    request: readonly(request),
    // True while a tour step needs the nav rail open, whatever the user's own setting.
    navRailExpanded: readonly(navRailExpanded),
    startTour,
    offerTour,
    offerTourWhen,
    takeRequest,
    setNavRailExpanded,
    recordedTourIds,
    hasSeen,
    markSeen,
    forget,
  }
}
