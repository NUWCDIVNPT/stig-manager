import { reactive } from 'vue'

const state = reactive({
  classification: null,
  user: null,
})

export function useGlobalAppStore() {
  return {
    get classification() {
      return state.classification
    },
    get user() {
      return state.user
    },
    setClassification(classification) {
      state.classification = classification
    },
    setUser(user) {
      state.user = user
    },
  }
}
