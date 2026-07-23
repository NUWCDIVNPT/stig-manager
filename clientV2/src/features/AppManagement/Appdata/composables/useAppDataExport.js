import { reactive } from 'vue'
import { downloadAppData } from '../api/appDataApi.js'

// Export state machine per the implementation guide, section 11:
//   idle -> requesting -> streaming/downloading -> complete
//                      \-> failed
export function useAppDataExport() {
  const state = reactive({
    phase: 'idle',
    format: 'gzip',
    error: null,
  })

  let abortController = null

  async function startDownload() {
    if (state.phase === 'requesting' || state.phase === 'streaming') {
      return
    }
    state.phase = 'requesting'
    state.error = null
    abortController = new AbortController()

    try {
      await downloadAppData({
        format: state.format,
        signal: abortController.signal,
        onStreamStart: () => {
          state.phase = 'streaming'
        },
      })
      state.phase = 'complete'
    }
    catch (err) {
      if (err?.name === 'AbortError') {
        state.phase = 'idle'
        return
      }
      state.phase = 'failed'
      state.error = err?.message || String(err)
    }
    finally {
      abortController = null
    }
  }

  function cancelDownload() {
    abortController?.abort()
  }

  return {
    state,
    startDownload,
    cancelDownload,
  }
}
