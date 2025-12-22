import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { createApp, h, watch } from 'vue'
import App from './App.vue'
import AuthBootstrapError from './auth/AuthBootstrapError.vue'
import { bootstrapAuth } from './auth/bootstrap.js'
import { bootstrapStateWorker, useStateWorker } from './auth/useStateWorker.js'
import ApiStateBootstrap from './components/global/ApiStateBootstrap.vue'
import { BluePreset, MyPrimeVuePT } from './primevueTheme.js'
import router from './router'
import { useGlobalAppStore } from './shared/stores/globalAppStore.js'
import { bootstrapEnv, useEnv } from './shared/stores/useEnv.js'
import 'primeicons/primeicons.css'
import './style.css'

// this is a dark mode override — in the future we may want to make this dynamic based on user preference?
if (typeof document !== 'undefined') {
  document.documentElement.classList.add('app-dark')
}

// vue-query client setup with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000, // 30 seconds
    },
  },
})

try {
  // bootstrap enviornment
  await bootstrapEnv()
  // Use the composable to get the reactive state ref so we can react to updates later
  const { state: reactiveState } = useStateWorker()

  // Create Pinia instance early so it can be used in bootstrap
  const pinia = createPinia()

  // bootstrapStateWorker returns an inital result result snapshot
  const stateResult = await bootstrapStateWorker()

  // fatal error (API unreachable)
  if (!stateResult.ok) {
    throw new Error(stateResult.error || 'Unknown error during state worker bootstrap')
  }
  // check if available
  const isReady = (initialState) => {
    if (!initialState) {
      return false
    }
    if (initialState.currentState === 'available') {
      return true
    }
    return false
  }

  // helper to mount the real app (requires an auth boot result)
  const mountApp = async (authBootResult) => {
    const app = createApp(App)
    app.use(pinia)

    // set classification in global app state from env
    const globalAppState = useGlobalAppStore(pinia)
    globalAppState.setClassification(useEnv().apiConfig?.classification || 'NONE')

    // Fetch user data before mounting the app
    try {
      const { fetchCurrentUser } = await import('./shared/api/userApi.js')
      const userData = await fetchCurrentUser(authBootResult.oidcWorker.token, useEnv().apiUrl)
      globalAppState.setUser(userData)
    }
    catch (error) {
      console.error('Failed to fetch user data:', error)
      const errApp = createApp(AuthBootstrapError, {
        details: `Failed to fetch user data: ${error.message || 'Unknown error'}`,
      })
      errApp.mount('#app')
      return
    }

    app.use(PrimeVue, {
      theme: {
        preset: BluePreset,
        options: {
          // Use the presence of .app-dark on <html> to enable dark mode
          darkModeSelector: '.app-dark',
        },
      },
      pt: MyPrimeVuePT,
    })

    app.use(VueQueryPlugin, {
      queryClient,
      devtools: {
        enabled: true,
        initialIsOpen: true,
      },
    })
    // app.use(VueQueryDevtools, {
    //   initialIsOpen: false,
    //   position: 'top-left', // can change to 'top-left', etc.
    // })

    app.use(router)
    app.provide('worker', authBootResult.oidcWorker)
    app.mount('#app')
  }

  // If initialState indicates unavailable, show the state info and keep listening
  if (stateResult.state && !isReady(stateResult.state)) {
    // mount the state display component and pass the initial state as a prop
    const stateApp = createApp(ApiStateBootstrap, { initialState: stateResult.state })
    stateApp.mount('#app')

    // watch reactive state for changes and re-mount when available
    const stop = watch(
      () => reactiveState.value, // watch the reactive state from the worker
      async (newVal) => {
        if (isReady(newVal)) { // now available
          stateApp.unmount() // remove that waiting view thing
          stop() // stop watching?

          // Now that state is ready, bootstrap auth and mount the app
          const authBootResult = await bootstrapAuth(pinia)
          if (!authBootResult.success) {
            // auth bootstrap failed — show error component
            const errApp = createApp(AuthBootstrapError, {
              details: authBootResult.error ? JSON.stringify(authBootResult.error, null, 2) : undefined,
            })
            errApp.mount('#app')
            return
          }
          // bootstrap auth and mount
          mountApp(authBootResult)
        }
      },
      { immediate: false },
    )
  }
  // state is already ready
  else {
    const authBootResult = await bootstrapAuth(pinia)
    // attempt to bootstrap auth
    if (!authBootResult.success) {
      // auth bootstrap failed — show error component
      const errApp = createApp(AuthBootstrapError, {
        details: authBootResult.error ? JSON.stringify(authBootResult.error, null, 2) : undefined,
      })
      errApp.mount('#app')
    }
    else {
      // bootstrap auth and mount
      mountApp(authBootResult)
    }
  }
}
// catch all for any errors
catch (err) {
  const apiErrApp = createApp({
    render: () => h('div', { style: 'padding:24px;font-family:system-ui,Arial,Helvetica,sans-serif' }, `Bootstrap failed.${err}`),
  })
  apiErrApp.mount('#app')
}
