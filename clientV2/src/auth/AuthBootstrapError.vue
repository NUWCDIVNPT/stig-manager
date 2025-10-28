<template>
  <div class="auth-error-root">
    <div class="card">
      <h1>Authentication failed</h1>
      <p>We were unable to initialize authentication. The application cannot continue without auth.</p>
      <pre v-if="details" class="error-details">{{ details }}</pre>
      <button @click="reload">Retry</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AuthBootstrapError',
  props: {
    details: {
      type: [String, Object],
      default: null,
    },
  },
  methods: {
    reload() {
      // rerrun app completely
      window.location.reload()
    },
  },
}
</script>

<style scoped>
.auth-error-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #37383f;
}
.card {
  padding: 24px;
  border-radius: 6px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  max-width: 520px;
  text-align: center;
}
.error-details {
  text-align: center;
  padding: 8px;
  margin: 12px 0;
  border-radius: 4px;
  overflow: auto;
  max-height: 160px;
}
button {
  background: rgb(62, 151, 202);
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 4px;
  cursor: pointer;
}
</style>
