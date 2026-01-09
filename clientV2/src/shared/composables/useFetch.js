import { ref, toValue, watchEffect } from 'vue'

export function useFetch(url, options = {}) {
  const data = ref(null)
  const error = ref(null)
  const isLoading = ref(false)
  const isFinished = ref(false)

  const fetchData = async () => {
    const urlValue = toValue(url)
    if (!urlValue) {
      return
    }

    isLoading.value = true
    isFinished.value = false
    error.value = null

    try {
      const response = await fetch(urlValue, toValue(options))

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`)
      }

      const text = await response.text()
      data.value = text ? JSON.parse(text) : null
    }
    catch (e) {
      error.value = e
      throw new Error(e)
    }
    finally {
      isLoading.value = false
      isFinished.value = true
    }
  }

  // Automatically fetch if URL is provided and reactive, or just once if string
  watchEffect(() => {
    fetchData()
  })

  return { data, error, isLoading, isFinished, execute: fetchData }
}
