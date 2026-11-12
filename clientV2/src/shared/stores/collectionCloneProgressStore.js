import { reactive } from 'vue'
import CollectionCloneProgressNotification from '../../features/CollectionManage/components/CollectionCloneProgressNotification.vue'
import { useNotifications } from '../composables/useNotifications.js'

export function useCollectionCloneProgressStore() {
  const notifs = useNotifications()

  // Each clone gets its own progress record and notification, so concurrent
  // clones are tracked independently (parity with the Ext.js client, which
  // opened a separate progress window per clone).
  function start({ dstCollectionName }) {
    const state = reactive({
      stages: [],
      isActive: true,
      isDone: false,
      error: null,
      dstCollectionId: null,
      dstCollectionName: dstCollectionName || '',
    })

    const notifId = notifs.push(CollectionCloneProgressNotification, { state })

    function pushStage(event) {
      if (event && typeof event === 'object') {
        state.stages.push(event)
        if (event.status === 'error') {
          state.isActive = false
          state.isDone = true
          state.error = event.message || 'Clone failed'
        }
        if (event.stage === 'result' && event.collection) {
          state.dstCollectionId = event.collection.collectionId
          state.isActive = false
          state.isDone = true
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
      notifs.remove(notifId)
    }

    return { state, pushStage, finish, fail, dismiss }
  }

  return { start }
}
