<script setup>
defineProps({
  peekMode: { type: Boolean, default: false },
  visible: { type: Boolean, default: true },
})

const emit = defineEmits(['peak', 'open'])
</script>

<template>
  <div
    id="nav-tab"
    class="tab"
    :class="{ 'is-hidden': visible && !peekMode }"
    role="button"
    tabindex="0"
    aria-controls="nav-drawer"
    @click="emit('peak')"
    @keydown.enter.prevent="emit('peak')"
    @keydown.space.prevent="emit('peak')"
  >
    <button
      id="drawer-tab-button"
      type="button"
      class="btn-unstyled tab-btn"
      aria-label="Toggle drawer (alt)"
      @click.stop="emit('open')"
      @keydown.enter.stop.prevent="emit('open')"
      @keydown.space.stop.prevent="emit('open')"
    >
      <span aria-hidden="true" class="icon" :class="peekMode ? 'icon-collapse-left' : 'icon-collapse-right'" />
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
  z-index: 900;
  display: grid;
  place-items: center;
  width: 22px;
  background: #3d4245;
  cursor: pointer;
  transition: opacity 150ms linear;
}

.tab.is-hidden {
  opacity: 0;
  pointer-events: none;
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

.icon-collapse-left {
  width: 14px;
  height: 14px;
  background-image: url('/src/assets/collapse-left.svg');
}
</style>
