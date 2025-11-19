<script setup>
import { computed, inject } from 'vue'

// emits logout and close
const emit = defineEmits(['logout', 'close'])
const oidcWorker = inject('worker')
const tokenTooltip = computed(() => {
  try {
    return JSON.stringify(oidcWorker.tokenParsed, null, 2)
  }
  catch {
    return ''
  }
})
</script>

<template>
  <header class="header">
    <span class="title" :title="tokenTooltip">
      {{ oidcWorker.tokenParsed.preferred_username }}
    </span>
    <div class="controls">
      <button type="button" class="btn-unstyled ctrl-btn" aria-label="Log out" @click="emit('logout')">
        <span aria-hidden="true" class="icon icon-logout" />
      </button>
      <button type="button" class="btn-unstyled ctrl-btn" aria-label="Close drawer" @click="emit('close')">
        <span aria-hidden="true" class="icon icon-collapse-left" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.btn-unstyled {
  background: none;
  border: 0;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
}

.header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.08);
}

.title {
  font-weight: 600;
  font-size: 13px;
  color: #f4f4f5;
}

.controls {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
}

.ctrl-btn {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.ctrl-btn .icon {
  opacity: 0.8;
  transition:
    opacity 120ms linear,
    filter 120ms linear,
    transform 120ms linear;
}

.ctrl-btn:hover .icon {
  opacity: 1;
  filter: brightness(1.1);
}

.ctrl-btn:active .icon {
  filter: brightness(1.1);
  transform: translateY(0.5px);
}

.icon {
  display: inline-block;
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}

.icon-logout {
  width: 16px;
  height: 16px;
  background-image: url('/src/assets/logout.svg');
}

.icon-collapse-left {
  width: 14px;
  height: 14px;
  background-image: url('/src/assets/collapse-left.svg');
}
</style>
