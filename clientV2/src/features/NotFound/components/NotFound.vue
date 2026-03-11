<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="not-found">
    <div class="not-found__content">
      <span class="not-found__code">404</span>
      <h1 class="not-found__title">
        Page Not Found
      </h1>
      <p class="not-found__message">
        The page you're looking for doesn't exist.
      </p>
      <button class="not-found__action" @click="goHome">
        <i class="pi pi-home" />
        Go Home
      </button>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 60vh;
}

.not-found__content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.not-found__code {
  font-size: 5rem;
  font-weight: 700;
  line-height: 1;
  opacity: 0.3;
}

.not-found__title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.not-found__message {
  max-width: 28rem;
  opacity: 0.7;
  margin: 0;
}

.not-found__action {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.625rem 1.25rem;
  background: var(--color-primary-highlight);
  color: var(--color-text-primary);
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.15s ease;
}

.not-found__action:hover {
  background: var(--color-primary-highlight-light);
}
</style>
