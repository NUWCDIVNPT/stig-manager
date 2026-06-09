import { reactive } from 'vue'
import CollectionExportProgressNotification from '../../features/CollectionManage/ExportResults/components/CollectionExportProgressNotification.vue'
import { useNotifications } from '../composables/useNotifications.js'

const state = reactive({
  stages: [],
  isActive: false,
  isDone: false,
  error: null,
  dstCollectionId: null,
  dstCollectionName: '',
})

let _notifId = null

export function useCollectionExportProgressStore() {
  const notifs = useNotifications()

  function start({ dstCollectionId, dstCollectionName }) {
    dismiss()
    state.stages = []
    state.isActive = true
    state.isDone = false
    state.error = null
    state.dstCollectionId = dstCollectionId ?? null
    state.dstCollectionName = dstCollectionName || ''
    _notifId = notifs.push(CollectionExportProgressNotification, { state })
  }

  function pushStage(event) {
    if (event && typeof event === 'object') {
      state.stages.push(event)
      if (event.status === 'error') {
        state.isActive = false
        state.isDone = true
        state.error = event.message || 'Export failed'
      }
    }
  }

  function finish() {
    state.isActive = false
    state.isDone = true
  }

  function fail(err) {
    state.isActive = false
    state.isDone = true
    state.error = err?.body ?? err?.message ?? String(err)
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

  return { state, start, pushStage, finish, fail, dismiss, isActive }
}
