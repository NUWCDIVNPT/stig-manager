import { effectScope, reactive, watch } from 'vue'
import ImportProgressNotification from '../../features/ImportWizard/components/ImportProgressNotification.vue'
import { useNotifications } from '../composables/useNotifications.js'

const state = reactive({
  progressText: '',
  completedCount: 0,
  totalCount: 0,
  isDone: false,
  // The finished import's per-asset rows, kept here because the modal that ran
  // the import may have unmounted by the time the user clicks "View Results".
  rows: [],
  resultsVisible: false,
})

let _notifId = null
let _syncScope = null

function stopSync() {
  _syncScope?.stop()
  _syncScope = null
}

function finish(rows) {
  state.rows = [...rows]
  state.isDone = true
  stopSync()
}

export function useImportProgressStore() {
  const notifs = useNotifications()

  function startBackground({ totalCount, executor }) {
    // dismiss any existing notification first (handles stale IDs too)
    dismiss()
    state.isDone = false
    state.completedCount = 0
    state.totalCount = totalCount
    state.progressText = ''
    state.rows = []
    _notifId = notifs.push(ImportProgressNotification, { state })

    // Detached: the import outlives the modal that started it, so this watcher
    // has to as well.
    _syncScope = effectScope(true)
    _syncScope.run(() => {
      watch(
        [executor.importProgressText, () => executor.importStatusRows.value.length, executor.importIsDone],
        ([text, count, done]) => {
          state.progressText = text
          state.completedCount = count
          if (done) {
            finish(executor.importStatusRows.value)
          }
        },
        { immediate: true },
      )
    })
  }

  function dismiss() {
    stopSync()
    if (_notifId !== null) {
      notifs.remove(_notifId)
      _notifId = null
    }
  }

  function isActive() {
    return _notifId !== null
  }

  function requestViewResults() {
    state.resultsVisible = true
    dismiss()
  }

  function closeResults() {
    state.resultsVisible = false
    state.rows = []
  }

  return { state, startBackground, dismiss, isActive, requestViewResults, closeResults }
}
