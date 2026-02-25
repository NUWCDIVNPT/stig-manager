import { reactive } from 'vue'

const state = reactive({
  selectedData: null,
})

export function useSelectedCollectionStore() {
  return {
    get selectedData() {
      return state.selectedData
    },
    select(node) {
      state.selectedData = node
    },
  }
}
