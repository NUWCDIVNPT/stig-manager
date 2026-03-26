<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { ref } from 'vue'
import { readStoredValue, storeValue } from '../../../shared/lib/localStorage.js'
import { useNavItems } from '../composables/useNavItems.js'
import { useRouteTracking } from '../composables/useRouteTracking.js'
import NavRailCollectionsItem from './NavRailCollectionsItem.vue'
import NavRailRecentViews from './NavRailRecentViews.vue'

const STORAGE_KEY = 'stigman:navRailExpanded'

useRouteTracking()
const { navItems } = useNavItems()

const expanded = ref(readStoredValue(STORAGE_KEY, 'false') === 'true')
const isAnimating = ref(false)

function toggleExpanded() {
  isAnimating.value = true
  expanded.value = !expanded.value
  storeValue(STORAGE_KEY, String(expanded.value))

  setTimeout(() => {
    isAnimating.value = false
  }, 200)
}
</script>

<template>
  <Splitter
    class="nav-rail-splitter"
    :pt="{
      gutter: { style: 'background: var(--color-background-darkest)' },
      root: { style: 'border: none; border-radius: 0; background: transparent; height: 100%; overflow: hidden;' },
    }"
  >
    <SplitterPanel
      :size="7"
      :min-size="4"
      :pt="{ root: { class: { 'nav-panel--collapsed': !expanded, 'nav-panel--animating': isAnimating }, style: 'min-width: 12rem; max-width: 35rem;' } }"
    >
      <nav class="nav-rail">
        <button
          class="nav-rail-toggle"
          :aria-label="expanded ? 'Collapse navigation' : 'Expand navigation'"
          @click="toggleExpanded"
        >
          <i :class="expanded ? 'pi pi-angle-left' : 'pi pi-angle-right'" />
        </button>

        <div class="nav-scroll-area">
          <div class="nav-rail-items">
            <template v-for="item in navItems" :key="item.key">
              <NavRailCollectionsItem
                v-if="item.key === 'collections'"
                :expanded="expanded"
                :active="item.matchFn()"
                :label="item.label"
                :icon-class="item.iconClass"
              />

              <router-link
                v-else
                :to="item.route"
                class="nav-rail-item"
                :class="{ 'nav-rail-item--active': item.matchFn() }"
                :title="expanded ? undefined : item.label"
              >
                <span
                  v-if="item.icon"
                  class="nav-rail-item-icon"
                  :class="item.icon"
                />
                <span
                  v-else-if="item.iconClass"
                  class="nav-rail-item-icon nav-icon"
                  :class="item.iconClass"
                />
                <span v-if="expanded" class="nav-rail-item-label">{{ item.label }}</span>
              </router-link>
            </template>
          </div>

          <div class="nav-rail-separator" />

          <NavRailRecentViews :expanded="expanded" />
        </div>
      </nav>
    </SplitterPanel>
    <SplitterPanel :size="93">
      <slot />
    </SplitterPanel>
  </Splitter>
</template>

<style scoped>
@import './style.css';

.nav-rail {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: var(--color-background-dark);
  overflow: hidden;
}

.nav-scroll-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-default) transparent;
}

.nav-scroll-area::-webkit-scrollbar {
  width: 6px;
}

.nav-scroll-area::-webkit-scrollbar-track {
  background: transparent;
}

.nav-scroll-area::-webkit-scrollbar-button {
  display: none;
  width: 0;
  height: 0;
}

.nav-scroll-area::-webkit-scrollbar-thumb {
  background-color: var(--color-border-default);
  border-radius: 999px;
  border: none;
  min-height: 28px;
}

.nav-scroll-area::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-border-hover);
}

.nav-rail-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 4.3rem;
  background: none;
  border: none;
  border-bottom: 1px solid var(--color-border-default);
  color: var(--color-text-dim);
  cursor: pointer;
  flex-shrink: 0;
}

.nav-rail-toggle:hover {
  color: var(--color-text-primary);
  background-color: var(--color-button-hover-bg);
}

.nav-rail-separator {
  height: 1px;
  margin: 0.35rem 0.75rem;
  background-color: var(--color-background-dark);
  flex-shrink: 0;
}

:deep(.nav-panel--animating) {
  transition: flex-basis 0.2s ease, width 0.2s ease, min-width 0.2s ease, max-width 0.2s ease !important;
}

:deep(.nav-panel--collapsed) {
  flex: none !important;
  flex-basis: 4.35rem !important;
  width: 4.35rem !important;
  min-width: 4.35rem !important;
  max-width: 4.35rem !important;
  overflow: hidden;
}

.nav-rail-splitter {
  width: 100%;
  height: 100%;
}
</style>
