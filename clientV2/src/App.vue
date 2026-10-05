<script setup>
import { ref } from 'vue'
import ReauthPrompt from './auth/ReauthPrompt.vue'
import { useOidcWorker } from './auth/useOidcWorker.js'
import GlobalBanner from './components/global/GlobalBanner.vue'
import GlobalErrorModal from './components/global/GlobalErrorModal.vue'
import GlobalNotifications from './components/global/GlobalNotifications.vue'
import GlobalServiceOverlay from './components/global/GlobalServiceOverlay.vue'
import OrientationTour from './components/global/OrientationTour.vue'
import WhatsNew from './components/global/WhatsNew.vue'
import HomePage from './Home/Home.vue'

const oidcWorker = useOidcWorker()

// The orientation tour waits for What's New so the two never open together.
const whatsNewSettled = ref(false)
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
  <WhatsNew @settled="whatsNewSettled = true" />
  <GlobalNotifications />
  <HomePage />
  <OrientationTour v-if="whatsNewSettled" />
</template>

<style scoped>
</style>
