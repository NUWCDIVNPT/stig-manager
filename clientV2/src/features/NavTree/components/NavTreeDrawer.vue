<script setup>
import { computed } from 'vue'
import { useGlobalAppStore } from '../../../shared/stores/globalAppStore.js'

// props
// visible: boolean, default true
// peekMode: boolean, default false
defineProps({
  visible: { type: Boolean, default: true },
  peekMode: { type: Boolean, default: false },
})

// needed for banner height calculation
const globalAppState = useGlobalAppStore()

// check if banner is shown based on classification
const bannerHeight = computed(() => {
  const cls = globalAppState.classification
  return cls && cls !== 'NONE' ? '20px' : '0px'
})
</script>

<template>
  <aside
    id="nav-drawer"
    class="drawer"
    :class="{ 'is-open': visible, 'is-peek': peekMode }"
    :style="{ '--banner-height': bannerHeight }"
    aria-label="Navigation drawer"
  >
    <slot name="header" />
    <div class="body" :class="{ 'peek-padding': peekMode }">
      <slot />
    </div>
    <div class="drawer-footer">
      <slot name="footer" />
    </div>
  </aside>
</template>

<style scoped>
.drawer {
  position: fixed;
  top: calc(var(--banner-height, 0px) + 3px);
  bottom: 10px;
  left: 5px;
  width: 300px;
  background: #2f3031;
  color: #4d69a0;
  border-radius: 8px;
  transform: translateX(-110%);
  transition:
    transform 150ms ease-out,
    opacity 150ms ease-out;
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: calc(100vh - var(--banner-height, 0px) - 13px);
  z-index: var(--z-drawer);
}

.drawer.is-open {
  transform: translateX(0);
  z-index: 1100;
}

.drawer.is-peek {
  left: 22px;
}

.body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: 2f3031#1f1f1f;
  color: #e4e4e7;
  overflow: hidden;
}

.drawer-footer {
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: #1f1f1f;
}

.peek-padding {
  padding-left: 8px;
}
</style>
