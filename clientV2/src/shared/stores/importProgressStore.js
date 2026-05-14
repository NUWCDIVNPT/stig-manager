import { reactive } from 'vue'
import ImportProgressNotification from '../../features/ImportWizard/components/ImportProgressNotification.vue'
import { useNotifications } from '../composables/useNotifications.js'

const state = reactive({
  progressText: '',
  completedCount: 0,
  totalCount: 0,
  isDone: false,
})

let _notifId = null

export function useImportProgressStore() {
  const notifs = useNotifications()

  function startBackground({ totalCount }) {
    // dismiss any existing notification first (handles stale IDs too)
    dismiss()
    state.isDone = false
    state.completedCount = 0
    state.totalCount = totalCount
    state.progressText = ''
    _notifId = notifs.push(ImportProgressNotification, { state })
  }

  function update(progressText, completedCount) {
    state.progressText = progressText
    state.completedCount = completedCount
  }

  function finish() {
    state.isDone = true
  }

  function dismiss() {
    if (_notifId !== null) {
      notifs.remove(_notifId)
      _notifId = null
    }
  }

  function isActive() {
    return _notifId !== null
  }

  return { state, startBackground, update, finish, dismiss, isActive }
}
