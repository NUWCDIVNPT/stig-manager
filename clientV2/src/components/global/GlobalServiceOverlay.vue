<script setup>
import { computed, onUnmounted, watch } from 'vue'
import { useStateWorker } from '../../auth/useStateWorker.js'
import ServiceReport from './ServiceReport.vue'

const { state, error: serviceError } = useStateWorker()
const displayed = computed(() => state.value ?? {})

const db = computed(() => displayed.value?.dependencies?.db ?? true)
const oidc = computed(() => displayed.value?.dependencies?.oidc ?? true)

const dbClass = computed(() => (db.value ? 'online' : 'offline'))
const oidcClass = computed(() => (oidc.value ? 'online' : 'offline'))

const hasOfflineDependency = computed(() => !db.value || !oidc.value)

watch(
  hasOfflineDependency,
  (on) => {
    document.body.classList.toggle('no-scroll', on)
  },
  { immediate: true },
)

onUnmounted(() => document.body.classList.remove('no-scroll'))
</script>

<template>
  <transition name="fade">
    <div v-if="hasOfflineDependency || !!serviceError" class="overlay" role="alertdialog" aria-modal="true" aria-live="assertive">
      <div class="overlay-panel">
        <ServiceReport :has-error="!!serviceError" :db-class="dbClass" :oidc-class="oidcClass" />
      </div>
    </div>
  </transition>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: var(--color-background-darkest);
  z-index: 9999;
  display: grid;
  place-items: center;
  backdrop-filter: blur(2px);
}
.overlay-panel {
  width: min(92vw, 640px);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<style>
body.no-scroll {
  overflow: hidden;
}
</style>
