<script setup>
import { computed } from 'vue'
import { useGlobalStateStore } from '../../../global-state/globalAuthState.js'

defineProps({
  visible: { type: Boolean, default: true },
  peekMode: { type: Boolean, default: false },
})

const globalState = useGlobalStateStore()

// check if banner is shown based on classification
const bannerHeight = computed(() => {
  const cls = globalState.classification
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
  </aside>
</template>

<style scoped>
.drawer {
  position: fixed;
  top: calc(var(--banner-height, 0px) + 3px);
  bottom: 10px;
  left: 0;
  width: 300px;
  background: #3d4245;
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
  background: #1f1f1f;
  color: #e4e4e7;
}

.peek-padding {
  padding-left: 8px;
}
</style>
