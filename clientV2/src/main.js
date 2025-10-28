/* eslint-disable vue/one-component-per-file */
import { createApp, watch, h } from 'vue'
import PrimeVue from 'primevue/config'
import Material from '@primeuix/themes/material'
import Tooltip from 'primevue/tooltip'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { bootstrapAuth } from './auth/bootstrap.js'
import './style.css'
import App from './App.vue'
import AuthBootstrapError from './auth/AuthBootstrapError.vue'
import { bootstrapStateWorker, useStateWorker } from './auth/useStateWorker.js'
import config from './config.js'
import ApiStateBootstrap from './components/global/ApiStateBootstrap.vue'

if (typeof document !== 'undefined') {
  document.documentElement.classList.add('app-dark')
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})
// Use the composable to get the reactive state ref so we can react to updates
const { state: reactiveState } = useStateWorker()

try {
  // bootstrapStateWorker returns an init result and initial state snapshot
  const stateResult = await bootstrapStateWorker({ apiBase: config.apiBase })

  // fatal error (API unreachable)
  if (!stateResult.ok) {
    throw new Error(stateResult.error || 'Unknown error during state worker bootstrap')
  }

  // grab initial state
  let initialState = stateResult.state ?? undefined

  // check if available
  const isReady = (initialState) => {
    if (!initialState) return false
    if (initialState.currentState === 'available') return true
    return false
  }

  // helper to mount the real app (requires an auth boot result)
  const mountApp = (authBootResult) => {
    const app = createApp(App)
    app.use(PrimeVue, {
      theme: {
        preset: Material,
        options: {
          // Use the presence of .app-dark on <html> to enable dark mode
          darkModeSelector: '.app-dark',
        },
      },
      //unstyled: true,
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

    // Note: router removed — app is now an SPA that renders a single App component.
    app.provide('worker', authBootResult.oidcWorker)
    app.directive('tooltip', Tooltip)
    app.mount('#app')
  }

  // If initialState indicates unavailable, show the state info and keep listening
  if (initialState && !isReady(initialState)) {
    // mount the state display component and pass the initial state as a prop
    const stateApp = createApp(ApiStateBootstrap, { initialState })
    stateApp.mount('#app')

    // watch reactive state for changes and re-mount when available
    const stop = watch(
      () => reactiveState.value,
      async (newVal) => {
        if (!newVal) return
        if (isReady(newVal)) {
          // unmount the state display and mount the real app
          stateApp.unmount()
          stop()

          // Now that state is ready, bootstrap auth and mount the app
          const authBootResult = await bootstrapAuth()
          if (!authBootResult.success) {
            const errApp = createApp(AuthBootstrapError, {
              details: authBootResult.error ? JSON.stringify(authBootResult.error, null, 2) : undefined,
            })
            errApp.mount('#app')
            return
          }

          mountApp(authBootResult)
        }
      },
      { immediate: false }
    )
  } else {
    // state is already ready — bootstrap auth and mount
    const authBootResult = await bootstrapAuth()
    if (!authBootResult.success) {
      const errApp = createApp(AuthBootstrapError, {
        details: authBootResult.error ? JSON.stringify(authBootResult.error, null, 2) : undefined,
      })
      errApp.mount('#app')
    } else {
      mountApp(authBootResult)
    }
  }
} catch (err) {
  const apiErrApp = createApp({
    render: () => h('div', { style: 'padding:24px;font-family:system-ui,Arial,Helvetica,sans-serif' }, `Bootstrap failed.${err}`),
  })
  apiErrApp.mount('#app')
}
