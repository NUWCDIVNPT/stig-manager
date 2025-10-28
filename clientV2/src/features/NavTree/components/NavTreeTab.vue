<script setup>
const emit = defineEmits(['toggle', 'toggle-alt'])
</script>

<template>
  <div
    id="nav-tab"
    class="tab"
    role="button"
    tabindex="0"
    aria-controls="nav-drawer"
    @click="emit('toggle')"
    @keydown.enter.prevent="emit('toggle')"
    @keydown.space.prevent="emit('toggle')"
  >
    <button
      type="button"
      class="btn-unstyled tab-btn"
      aria-label="Toggle drawer (alt)"
      @click.stop="emit('toggle-alt')"
      @keydown.enter.stop.prevent="emit('toggle-alt')"
      @keydown.space.stop.prevent="emit('toggle-alt')"
    >
      <span aria-hidden="true" class="icon icon-collapse-right" />
    </button>
  </div>
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

.tab {
  position: fixed;
  top: 23px;
  bottom: 10px;
  left: 0;
  z-index: 900;
  display: grid;
  place-items: center;
  width: 22px;
  background: #3d4245;
  cursor: pointer;
  transition: opacity 150ms linear;
}

.tab:focus {
  outline: none;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #a1a1aa;
}

.tab-btn:hover {
  color: #fff;
}

.tab-btn:active {
  color: #d4d4d8;
}

.icon {
  display: inline-block;
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}

.icon-collapse-right {
  width: 14px;
  height: 14px;
  background-image: url('/src/assets/collapse-right.svg');
}
</style>
