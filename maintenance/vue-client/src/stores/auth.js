import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const noTokenMessage = ref(null)
  const oidcWorker = ref(null) // Add this

  function setNoTokenMessage(message) {
    noTokenMessage.value = message
  }

  function clearNoTokenMessage() {
    noTokenMessage.value = null
  }

  function setOidcWorker(worker) { // Add this
    oidcWorker.value = worker
  }

  return {
    noTokenMessage,
    oidcWorker,
    setNoTokenMessage,
    clearNoTokenMessage,
    setOidcWorker
  }
})