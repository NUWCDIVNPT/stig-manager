<script setup>
const props = defineProps({
  redirectOidc: { type: String, required: true },
  codeVerifier: { type: String, required: true },
  state: { type: String, required: true },
})

function handleReauth() {
  const width = 600
  const height = 740
  const left = window.screenX + (window.outerWidth - width) / 2
  const top = window.screenY + (window.outerHeight - height) / 2

  localStorage.setItem('reauth-codeVerifier', props.codeVerifier)
  localStorage.setItem('reauth-oidcState', props.state)
  window.open(props.redirectOidc, '_blank', `popup,width=${width},height=${height},left=${left},top=${top}`)
}
</script>

<template>
  <div class="reauth-modal">
    <div class="reauth-content">
      <h2>Session Expired</h2>
      <p>Your session has expired and we need you to sign in again.</p>
      <button @click="handleReauth">
        Sign in
      </button>
    </div>
  </div>
</template>

<style scoped>
.reauth-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.reauth-content {
  background: #555;
  padding: 2rem 2.5rem;
  border-radius: 8px;
  text-align: center;
  min-width: 300px;
}
.reauth-content h2 {
  margin-bottom: 1rem;
}
.reauth-content button {
  margin-top: 1.5rem;
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  border: none;
  border-radius: 4px;
  background: #007ad9;
  color: var(--color-text-primary);
  cursor: pointer;
}
</style>
