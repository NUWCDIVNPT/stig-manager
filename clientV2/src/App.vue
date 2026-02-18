<script setup>
import ReauthPrompt from './auth/ReauthPrompt.vue'
import { useOidcWorker } from './auth/useOidcWorker.js'
import GlobalBanner from './components/global/GlobalBanner.vue'
import GlobalErrorModal from './components/global/GlobalErrorModal.vue'
import GlobalServiceOverlay from './components/global/GlobalServiceOverlay.vue'
import WhatsNew from './components/global/WhatsNew.vue'
import HomePage from './Home/Home.vue'

const oidcWorker = useOidcWorker()
console.log('oidcWorker state', oidcWorker)
</script>

<template>
  <GlobalBanner />
  <GlobalErrorModal />
  <ReauthPrompt
    v-if="oidcWorker.noTokenMessage.value"
    :redirect-oidc="oidcWorker.noTokenMessage.value?.redirectOidc"
    :code-verifier="oidcWorker.noTokenMessage.value?.codeVerifier"
    :state="oidcWorker.noTokenMessage.value?.state"
  />
  <GlobalServiceOverlay />
  <WhatsNew />
  <HomePage />
</template>

<style scoped>
</style>
