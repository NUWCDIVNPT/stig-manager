<script setup>
import { ref, watch, computed } from 'vue'
import { useAuthStore } from '../stores/auth.js'

const authStore = useAuthStore()
const isGlowing = ref(false)

// Create a computed property to get tokenParsed from the store
const tokenParsed = computed(() => {
  return authStore.oidcWorker?.tokenParsed || null
})

watch(tokenParsed, (newValue, oldValue) => {
  if (newValue?.jti !== oldValue?.jti) {
    isGlowing.value = true
    setTimeout(() => {
      isGlowing.value = false
    }, 1000) // Remove glow after 1 second
  }
})
</script>

<template>
  <div :class="{ 'glow': isGlowing }">
    <p>Access token</p>
    {{ tokenParsed }}
  </div>
</template>

<style scoped>
p {
  color: #42b883;
  font-weight: 600;
  font-size: 1.5em;
  margin-bottom: 0.5em;
  margin-top: -0.5em
}
.glow {
  animation: pulse-glow 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes pulse-glow {
  0% {
    box-shadow: 0 0 0px #163d2b, 0 0 0px #444;
    opacity: 1;
  }
  25% {
    box-shadow: 0 0 10px 10px #42b883, 0 0 10px #444;
    opacity: 1;
  }
  100% {
    box-shadow: 0 0 0px #42b883, 0 0 0px #444;
    opacity: 1;
  }
}

div {
  padding: 20px;
  border: 1px solid #444;
  margin: 20px;
  cursor: pointer;
}
</style>
