<script setup>
import Popover from 'primevue/popover'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useGlobalAppStore } from '../../../shared/stores/globalAppStore.js'
import { useRecentViews } from '../../../shared/composables/useRecentViews.js'

const STORAGE_KEY = 'stigman:navRailExpanded'

const route = useRoute()
const { user } = useGlobalAppStore()
const { recentViews } = useRecentViews()

const expanded = ref(loadExpandedState())
const recentViewsPopover = ref(null)

function loadExpandedState() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  }
  catch {
    return false
  }
}

function toggleExpanded() {
  expanded.value = !expanded.value
  try {
    localStorage.setItem(STORAGE_KEY, String(expanded.value))
  }
  catch {
    // localStorage unavailable
  }
}

const isAdmin = computed(() => user?.privileges?.admin)

const navItems = computed(() => {
  const items = [
    {
      key: 'home',
      label: 'Home',
      icon: 'pi pi-home',
      route: '/',
      matchFn: () => route.name === 'home',
    },
    {
      key: 'collections',
      label: 'Collections',
      iconClass: 'nav-icon-collection',
      route: '/collections',
      matchFn: () => route.name === 'collections'
        || route.name?.startsWith('collection'),
    },
    {
      key: 'library',
      label: 'STIG Library',
      iconClass: 'nav-icon-library',
      route: '/stig-library',
      matchFn: () => route.name === 'stig-library' || route.name === 'library',
    },
  ]

  if (isAdmin.value) {
    items.push({
      key: 'admin',
      label: 'Admin',
      iconClass: 'nav-icon-admin',
      route: '/app-management',
      matchFn: () => route.name === 'app-management'
        || route.name?.startsWith('admin'),
    })
  }

  return items
})

function isActive(item) {
  return item.matchFn()
}

function typeIcon(type) {
  switch (type) {
    case 'collection': return 'nav-icon-collection'
    case 'asset-review': return 'pi pi-file-edit'
    case 'library': return 'nav-icon-library'
    case 'admin': return 'nav-icon-admin'
    default: return 'pi pi-link'
  }
}

function toggleRecentViewsPopover(event) {
  recentViewsPopover.value.toggle(event)
}
</script>

<template>
  <nav
    class="nav-rail"
    :class="{ 'nav-rail--expanded': expanded }"
  >
    <!-- Toggle button -->
    <button
      class="nav-rail-toggle"
      :aria-label="expanded ? 'Collapse navigation' : 'Expand navigation'"
      @click="toggleExpanded"
    >
      <i :class="expanded ? 'pi pi-angle-left' : 'pi pi-angle-right'" />
    </button>

    <!-- Primary nav items -->
    <div class="nav-rail-items">
      <router-link
        v-for="item in navItems"
        :key="item.key"
        :to="item.route"
        class="nav-rail-item"
        :class="{ 'nav-rail-item--active': isActive(item) }"
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
    </div>

    <!-- Separator -->
    <div class="nav-rail-separator" />

    <!-- Recent Views -->
    <template v-if="expanded">
      <div class="nav-rail-section-label">
        Recent Views
      </div>
      <div class="nav-rail-recent">
        <router-link
          v-for="view in recentViews"
          :key="view.url"
          :to="view.url"
          class="nav-rail-recent-item"
          :title="view.label"
        >
          <span
            class="nav-rail-recent-icon"
            :class="view.icon || typeIcon(view.type)"
          />
          <span class="nav-rail-recent-label">{{ view.label }}</span>
        </router-link>
        <div v-if="recentViews.length === 0" class="nav-rail-recent-empty">
          No recent views
        </div>
      </div>
    </template>
    <template v-else>
      <button
        class="nav-rail-item nav-rail-item--icon-only"
        title="Recent Views"
        @click="toggleRecentViewsPopover"
      >
        <span class="nav-rail-item-icon pi pi-clock" />
      </button>
      <Popover ref="recentViewsPopover" class="recent-views-popover">
        <div class="recent-views-popover-header">
          Recent Views
        </div>
        <div class="recent-views-popover-list">
          <router-link
            v-for="view in recentViews"
            :key="view.url"
            :to="view.url"
            class="recent-views-popover-item"
            @click="recentViewsPopover.hide()"
          >
            <span
              class="nav-rail-recent-icon"
              :class="view.icon || typeIcon(view.type)"
            />
            <span>{{ view.label }}</span>
          </router-link>
          <div v-if="recentViews.length === 0" class="nav-rail-recent-empty">
            No recent views
          </div>
        </div>
      </Popover>
    </template>
  </nav>
</template>

<style scoped>
.nav-rail {
  grid-area: rail;
  display: flex;
  flex-direction: column;
  width: 48px;
  background-color: var(--color-surface-dark, #18181b);
  border-right: 1px solid var(--color-border, #3f3f46);
  overflow: hidden;
  transition: width 0.2s ease;
}

.nav-rail--expanded {
  width: 200px;
}

.nav-rail-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 36px;
  background: none;
  border: none;
  border-bottom: 1px solid var(--color-border, #3f3f46);
  color: var(--color-text-dim, #a1a1aa);
  cursor: pointer;
  flex-shrink: 0;
}

.nav-rail-toggle:hover {
  color: var(--color-text-primary, rgba(255, 255, 255, 0.87));
  background-color: var(--color-surface-hover, #27272a);
}

.nav-rail-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px;
}

.nav-rail-item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 12px;
  border-radius: 6px;
  color: var(--color-text-dim, #a1a1aa);
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  background: none;
  border: none;
  width: 100%;
  font-size: inherit;
  font-family: inherit;
}

.nav-rail-item:hover {
  background-color: var(--color-surface-hover, #27272a);
  color: var(--color-text-primary, rgba(255, 255, 255, 0.87));
}

.nav-rail-item--active {
  background-color: var(--color-primary-highlight, rgba(99, 102, 241, 0.16));
  color: var(--color-primary, #6366f1);
}

.nav-rail-item--icon-only {
  justify-content: center;
  padding: 0;
}

.nav-rail-item-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.nav-rail-item-label {
  font-size: 1.1rem;
  font-weight: 500;
}

/* Custom SVG icons */
.nav-icon {
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}

.nav-icon-collection {
  background-image: url('/src/assets/collection-color.svg');
}

.nav-icon-library {
  background-image: url('/src/assets/library.svg');
}

.nav-icon-admin {
  background-image: url('/src/assets/gear.svg');
}

.nav-rail-separator {
  height: 1px;
  margin: 4px 8px;
  background-color: var(--color-border, #3f3f46);
  flex-shrink: 0;
}

/* Section label for expanded state */
.nav-rail-section-label {
  padding: 8px 12px 4px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-dim, #a1a1aa);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  overflow: hidden;
}

/* Recent views list in expanded state */
.nav-rail-recent {
  flex: 1;
  overflow-y: auto;
  padding: 0 4px;
}

.nav-rail-recent-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  color: var(--color-text-dim, #a1a1aa);
  text-decoration: none;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
}

.nav-rail-recent-item:hover {
  background-color: var(--color-surface-hover, #27272a);
  color: var(--color-text-primary, rgba(255, 255, 255, 0.87));
}

.nav-rail-recent-icon {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}

.nav-rail-recent-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-rail-recent-empty {
  padding: 8px 12px;
  font-size: 0.95rem;
  color: var(--color-text-dim, #a1a1aa);
  font-style: italic;
}

/* Popover styles for collapsed state */
:deep(.recent-views-popover) {
  min-width: 220px;
  max-width: 300px;
}

.recent-views-popover-header {
  padding: 8px 12px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary, rgba(255, 255, 255, 0.87));
  border-bottom: 1px solid var(--color-border, #3f3f46);
}

.recent-views-popover-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 4px;
}

.recent-views-popover-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  color: var(--color-text-dim, #a1a1aa);
  text-decoration: none;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
}

.recent-views-popover-item:hover {
  background-color: var(--color-surface-hover, #27272a);
  color: var(--color-text-primary, rgba(255, 255, 255, 0.87));
}
</style>
