import { defineStore } from 'pinia'

// nav tree store
// handles navigation tree selection state
export const useSelectedCollectionStore = defineStore('selectedCollection', {
  state: () => ({
    selectedData: null,
  }),
  actions: {
    select(node) {
      this.selectedData = node
    },
  },
})
