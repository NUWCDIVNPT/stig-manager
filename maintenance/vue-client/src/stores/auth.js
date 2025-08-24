import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    noTokenMessage: null
  }),
  actions: {
    setNoTokenMessage(msg) {
      this.noTokenMessage = msg
    },
    clearNoTokenMessage() {
      this.noTokenMessage = null
    }
  }
})