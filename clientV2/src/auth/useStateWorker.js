import { ref } from 'vue'

const state = ref(null) // current state object from the worker
const error = ref(null)

export function setupStateHandler() {
  // init.js skips creating the state worker when STIGMAN_CLIENT_STATE_EVENTS
  // is false. state then stays null, which every consumer treats as "no report".
  if (!STIGMAN.stateWorker?.workerChannel) {
    return
  }
  STIGMAN.stateWorker.workerChannel.addEventListener('message', async (ev) => {
    const eventMessage = ev.data || {}
    // successful state updates should update state and clear any prior error
    if ((eventMessage.type === 'state-changed' || eventMessage.type === 'state-report') && eventMessage.data) {
      try {
        state.value = JSON.parse(eventMessage.data)
      }
      catch {
        state.value = null
      }
      // clear previous error when we get a fresh state
      error.value = null
    }
    // explicit state error messages from the worker
    if (eventMessage.type === 'state-error') {
      error.value = eventMessage.data
    }
  })
}

export function useStateWorker() {
  return {
    state,
    error,
  }
}
