import { defineStore } from 'pinia'

export const useGlobalStateStore = defineStore('globalState', {
  state: () => ({
    noTokenMessage: null,
    classification: null,
  }),
  actions: {
    setNoTokenMessage(msg) {
      this.noTokenMessage = msg
    },
    clearNoTokenMessage() {
      this.noTokenMessage = null
    },
    setClassification(classification) {
      this.classification = classification
    },
  },
})
