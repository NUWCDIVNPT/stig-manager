<script setup>
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

function toggleExpanded() {
  expanded.value = !expanded.value
  storeValue(STORAGE_KEY, String(expanded.value))
}
</script>

<template>
  <nav
    class="nav-rail"
    :class="{ 'nav-rail--expanded': expanded }"
  >
    <button
      class="nav-rail-toggle"
      :aria-label="expanded ? 'Collapse navigation' : 'Expand navigation'"
      @click="toggleExpanded"
    >
      <i :class="expanded ? 'pi pi-angle-left' : 'pi pi-angle-right'" />
    </button>

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
  </nav>
</template>

<style scoped>
@import './style.css';

.nav-rail {
  grid-area: rail;
  display: flex;
  flex-direction: column;
  width: 4.35rem;
  background-color: var(--color-background-dark);
  border-right: 1px solid var(--color-border-default);
  overflow: hidden;
  transition: width 0.2s ease;
}

.nav-rail--expanded {
  width: 18rem;
}

.nav-rail-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 3.25rem;
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
  background-color: var(--color-border-default);
  flex-shrink: 0;
}
</style>
