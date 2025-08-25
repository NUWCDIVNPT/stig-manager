import { ref } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { bootstrap } from '../modules/bootstrap.js'

export function useBootstrap() {
  const isBootstrapping = ref(true)
  const bootstrapError = ref(null)
  const authStore = useAuthStore()

  async function runBootstrap() {
    try {
      const bootResult = await bootstrap()
      if (!bootResult.success) {
        bootstrapError.value = bootResult.error || 'Failed to initialize.'
        return
      }
      authStore.setOidcWorker(bootResult.oidcWorker)

      if (bootResult.oidcWorker?.bc) {
        bootResult.oidcWorker.bc.addEventListener('message', (event) => {
          if (event.data?.type === 'noToken') {
            authStore.setNoTokenMessage(event.data)
          } else if (event.data?.type === 'accessToken') {
            authStore.clearNoTokenMessage()
          }
        })
      }
    } catch (error) {
      bootstrapError.value = error.message || 'Bootstrap failed'
    } finally {
      isBootstrapping.value = false
    }
  }

  return { isBootstrapping, bootstrapError, runBootstrap }
}