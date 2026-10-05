import { computed } from 'vue'
import { api } from '../api/apiClient.js'
import { useGlobalAppStore } from '../stores/globalAppStore.js'

// Per-user UI preferences stored by the API (/user/web-preferences) and loaded
// with the user at init. Browser storage is cleared on close in many
// deployments, so preferences that must outlive a session belong here.
//
// Keys other than the API's required ones are optional: read them with a
// default, because a user who has never set one will not have it.
export function useWebPreferences() {
  const appStore = useGlobalAppStore()

  const preferences = computed(() => appStore.user?.webPreferences ?? {})

  // The API applies a JSON merge-patch, so only the keys in `patch` change.
  async function patchPreferences(patch) {
    await api.patch('/user/web-preferences', patch)
    const user = appStore.user
    if (user) {
      user.webPreferences = { ...user.webPreferences, ...patch }
    }
  }

  return {
    preferences,
    patchPreferences,
  }
}
