import { ref } from 'vue'

export function useAsyncData(asyncFn, options = {}) {
  const data = ref(options.defaultValue ?? null)
  const isLoading = ref(false)
  const errorMessage = ref(null)

  async function execute() {
    isLoading.value = true
    errorMessage.value = null
    try {
      data.value = await asyncFn()
    } catch (err) {
      errorMessage.value = err.message || 'An error occurred'
    } finally {
      isLoading.value = false
    }
  }

  return { data, isLoading, errorMessage, execute }
}
