import { readonly, ref } from 'vue'

const error = ref(null)

export function useGlobalError() {
  const triggerError = (err) => {
    console.error('Global error triggered:', err)
    if (typeof err === 'string') {
      error.value = { message: err }
    }
    else if (err instanceof Error) {
      error.value = {
        message: err.message,
        stack: err.stack,
        name: err.name,
      }
    }
    else {
      error.value = { message: 'An unknown error occurred', details: err }
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    error: readonly(error),
    triggerError,
    clearError,
  }
}
