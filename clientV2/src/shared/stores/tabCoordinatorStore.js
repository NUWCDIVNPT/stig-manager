import { defineStore } from 'pinia'

// tab coordinator store
// handles tab lifecycle coordination (e.g., requesting tabs to close)
// this is used as a communication bus between features that need to close tabs
// and the TabList component that manages the tabs
export const useTabCoordinatorStore = defineStore('tabCoordinator', {
  state: () => ({
    closeSignal: null,
  }),
  actions: {
    requestClose(key) {
      if (!key) {
        return
      }
      this.closeSignal = {
        key,
        nonce: Date.now(),
      }
    },
    clearCloseSignal() {
      this.closeSignal = null
    },
  },
})
