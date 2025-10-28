<script setup>
import ReauthPrompt from './auth/ReauthPrompt.vue'
import GlobalBanner from './components/global/GlobalBanner.vue'
import GlobalServiceOverlay from './components/global/GlobalServiceOverlay.vue'
import { noTokenMessage } from './global-state/globalState.js'
import HomePage from './pages/StigmanSPA.vue'
</script>

<template>
  <GlobalBanner />
  <!-- Auth bits live here so they never unmount -->
  <ReauthPrompt
    v-if="noTokenMessage"
    :redirect="noTokenMessage.redirect"
    :code-verifier="noTokenMessage.codeVerifier"
    :state="noTokenMessage.state"
  />
  <GlobalServiceOverlay />
  <HomePage />
</template>

<style scoped>
:root {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
