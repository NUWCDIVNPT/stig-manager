import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import { bootstrap } from './modules/bootstrap.js'
const bootResult = await bootstrap()
if (!bootResult.success) console.error('Failed to initialize.')

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.provide('worker', bootResult.oidcWorker)
import { useAuthStore } from './stores/auth.js';
const authStore = useAuthStore();

if (bootResult.oidcWorker?.bc) {
  bootResult.oidcWorker.bc.addEventListener('message', (event) => {
    if (event.data?.type === 'noToken') {
      authStore.setNoTokenMessage(event.data);
    } else if (event.data?.type === 'accessToken') {
      authStore.clearNoTokenMessage();
    }
  });
}


app.mount('#app')
