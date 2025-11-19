import { defineStore } from 'pinia'

// auth state global store
// currently only used to store no token message? could be gotten rid of idk???
export const useGlobalStateStore = defineStore('globalState', {
  state: () => ({
    noTokenMessage: null,
  }),
  actions: {
    setNoTokenMessage(msg) {
      this.noTokenMessage = msg
    },
    clearNoTokenMessage() {
      this.noTokenMessage = null
    },
  },
})
