import { defineStore } from 'pinia'

// nav tree store
// handles navigation tree selection state
export const useNavTreeStore = defineStore('navTree', {
  state: () => ({
    selectedData: null,
  }),
  actions: {
    select(node) {
      this.selectedData = node
    },
  },
})
