import { reactive } from 'vue'

const state = reactive({
  noTokenMessage: null,
})

export function useGlobalStateStore() {
  return {
    get noTokenMessage() {
      return state.noTokenMessage
    },
    setNoTokenMessage(msg) {
      state.noTokenMessage = msg
    },
    clearNoTokenMessage() {
      state.noTokenMessage = null
    },
  }
}
