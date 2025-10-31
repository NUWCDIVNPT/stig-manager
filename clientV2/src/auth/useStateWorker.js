import { ref } from 'vue'
import { useEnv } from '../useEnv'

const state = ref(null) // current state object from the worker
const error = ref(null) // error messages from the worker
const channelName = ref(null)
const channel = ref(null)
const port = ref(null)

let _initPromise = null
let _lastApiBase = null

function sendWorkerRequest(payload) {
  if (!port.value) {
    throw new Error('state worker port is not initialized')
  }
  return new Promise((resolve) => {
    const requestId = crypto.randomUUID()
    const onMessage = (ev) => {
      if (!ev.data) {
        return
      }
      if (ev.data.requestId !== requestId) {
        return
      }
      port.value.removeEventListener('message', onMessage)
      resolve(ev.data.response)
    }
    port.value.addEventListener('message', onMessage)
    port.value.postMessage({ ...payload, requestId })
  })
}

// Default apiBase to runtime STIGMAN Env if available
async function initialize(apiBase = (typeof window !== 'undefined' && window.STIGMAN?.Env?.apiBase) || '/api') {
  // cache and reuse promise so multiple callers don't race this shouldnt happen but just in case (co pilot suggested this )
  if (_initPromise) {
    return _initPromise
  }

  _lastApiBase = apiBase
  _initPromise = (async () => {
    try {
      // use Vite-served worker path
      const worker = new SharedWorker('/state-worker.js', {
        name: 'app-state-worker',
        type: 'module',
      })
      port.value = worker.port
      port.value.start()

      const initResp = await sendWorkerRequest({ request: 'initialize', apiBase: _lastApiBase })

      if (initResp?.error) {
        error.value = initResp.error
        return { ok: false, error: initResp.error }
      }

      // clear any previous errors on successful initialize
      error.value = null

      channelName.value = initResp.channelName

      // initial state comes as a JSON string from the worker
      try {
        state.value = initResp.state ? JSON.parse(initResp.state) : null
      }
      catch {
        state.value = null
        error.value = 'failed to parse initial state'
      }

      // listen for state changes via BroadcastChannel
      if (channelName.value) {
        channel.value = new BroadcastChannel(channelName.value)
        channel.value.onmessage = (ev) => {
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
        }
      }
      return { ok: true }
    }
    catch (err) {
      error.value = String(err)
      return { ok: false, error: error.value }
    }
  })()

  return _initPromise
}

// Called from main.js to perform a one-time bootstrap and return an initial
// snapshot (main expects { ok: true/false, state })
export async function bootstrapStateWorker({ apiBase = (typeof window !== 'undefined' && window.STIGMAN?.Env?.apiBase) || '/api' } = {}) {
  const r = await initialize(apiBase)
  return { ...r, state: state.value }
}

export function useStateWorker() {
  return {
    state,
    error,
  }
}
