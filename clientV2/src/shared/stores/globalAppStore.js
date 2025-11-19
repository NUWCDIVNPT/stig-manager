import { defineStore } from 'pinia'

// global app state store
// used for general app-wide state that is not auth-related (as this grows we should create more narrow scoped stores)
export const useGlobalAppStore = defineStore('globalApp', {
  state: () => ({
    classification: null,
  }),
  actions: {
    setClassification(classification) {
      this.classification = classification
    },
  },
})
