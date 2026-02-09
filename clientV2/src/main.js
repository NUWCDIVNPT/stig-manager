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
import { api, configureApiSpec, configureAuth } from './shared/api/apiClient.js'

import { useGlobalError } from './shared/composables/useGlobalError.js'
import { useGlobalAppStore } from './shared/stores/globalAppStore.js'
import {  useEnv } from './shared/stores/useEnv.js'
import 'primeicons/primeicons.css'
import './style.css'

// this is a dark mode override — in the future we may want to make this dynamic based on user preference?
if (typeof document !== 'undefined') {
  document.documentElement.classList.add('app-dark')
}

try {
  // Create Pinia instance early so it can be used in bootstrap
  const pinia = createPinia()

  // Initialize apiClient with the OIDC worker token accessor
  configureAuth({
    getToken: () => window.oidcWorker.token,
  })

  const app = createApp(App)
  app.use(pinia)

  // Global Error Handler
  const { triggerError } = useGlobalError()
  app.config.errorHandler = (err, instance, info) => {
    console.error('Unhandled Global Error:', err, info)
    triggerError(err)
  }

  // set classification in global app state from env
  const globalAppState = useGlobalAppStore(pinia)
  globalAppState.setClassification(STIGMAN.Env.classification || 'NONE')
  globalAppState.setUser(STIGMAN.curUser)

  // Fetch and configure API Spec
  const spec = await api.get('/op/definition')
  configureApiSpec(spec)

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

  app.use(router)
  app.provide('worker', window.oidcWorker)
  // Debug: log current route after router is ready
  console.log('window.location.pathname', window.location.pathname)
  console.log('router base', router.options.history.base)
  console.log('router.currentRoute.value', router.currentRoute.value)
  app.mount('#app')
}
// catch all for any errors
catch (err) {
  const apiErrApp = createApp({
    render: () => h('div', { style: 'padding:24px;' }, `Bootstrap failed.${err}`),
  })
  apiErrApp.mount('#app')
}
