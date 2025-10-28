import { ref } from 'vue'

let store
export function useNavTreeStore() {
  if (store) return store

  const selectedData = ref(null)

  function select(node) {
    selectedData.value = node
  }

  store = { selectedData, select }
  return store
}
