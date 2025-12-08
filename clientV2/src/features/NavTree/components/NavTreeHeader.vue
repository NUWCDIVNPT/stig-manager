<script setup>
// emits close
const emit = defineEmits(['close'])
</script>

<template>
  <header class="header">
    <div class="brand">
      <div class="logo-container">
        <span class="logo-icon" />
      </div>
      <span class="title">Stig Manager</span>
    </div>
    <div class="controls">
      <RouterLink to="/" class="btn-unstyled ctrl-btn" aria-label="Home">
        <i class="pi pi-home icon" style="font-size: 1rem;color: rgba(182, 179, 179, 0.824); opacity: 0.6;" />
      </RouterLink>
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
  justify-content: space-between;
  padding: 16px 12px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  display: block;
  width: 25px;
  height: 25px;
  background-image: url('/src/assets/shield-green-check.svg');

}

.title {
  font-weight: 600;
  font-size: 16px;
  color: #f4f4f5;
  letter-spacing: -0.01em;
}

.controls {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 2px;
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

.icon-collapse-left {
  width: 14px;
  height: 14px;
  background-image: url('/src/assets/collapse-left.svg');
}
</style>
