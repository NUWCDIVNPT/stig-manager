<script setup>
import Popover from 'primevue/popover'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useRecentViews } from '../../../shared/composables/useRecentViews.js'
import { readStoredValue, storeValue } from '../../../shared/lib/localStorage.js'
import { useGlobalAppStore } from '../../../shared/stores/globalAppStore.js'
import NavRailCollectionsItem from './NavRailCollectionsItem.vue'

const STORAGE_KEY = 'stigman:navRailExpanded'

const route = useRoute()
const { user } = useGlobalAppStore()
const { recentViews, clearViews } = useRecentViews()

const expanded = ref(readStoredValue(STORAGE_KEY, 'false') === 'true')
const recentViewsPopover = ref(null)

const recentViewsPopoverPt = {
  root: { style: 'min-width: 20rem; max-width: 27rem' },
}

function toggleExpanded() {
  expanded.value = !expanded.value
  storeValue(STORAGE_KEY, String(expanded.value))
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
    {
      key: 'whats-new',
      label: 'What\'s New',
      icon: 'pi pi-megaphone',
      route: '/whats-new',
      matchFn: () => route.name === 'whats-new',
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

    <template v-if="expanded">
      <div class="nav-rail-section-header">
        <div class="nav-rail-section-label">
          Recent Views
        </div>
        <button
          v-if="recentViews.length > 0"
          class="nav-rail-clear-btn"
          title="Clear Recent Views"
          @click="clearViews"
        >
          <i class="pi pi-trash" />
        </button>
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
      <Popover ref="recentViewsPopover" :pt="recentViewsPopoverPt">
        <div class="recent-views-popover-header">
          <span>Recent Views</span>
          <button
            v-if="recentViews.length > 0"
            class="nav-rail-clear-btn"
            title="Clear Recent Views"
            @click="clearViews"
          >
            <i class="pi pi-trash" />
          </button>
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

.nav-rail-items {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.35rem;
}

.nav-rail-item {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  height: 3.6rem;
  padding: 0 1.1rem;
  border-radius: 0.55rem;
  color: var(--color-text-dim);
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
  background-color: var(--color-button-hover-bg);
  color: var(--color-text-primary);
}

.nav-rail-item--active {
  background-color: var(--color-bg-hover-strong);
  color: var(--color-text-primary);
}

.nav-rail-item--icon-only {
  justify-content: center;
  padding: 0;
}

.nav-rail-item-icon {
  flex-shrink: 0;
  width: 1.6rem;
  height: 1.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.nav-rail-item-label {
  font-size: 1.1rem;
  font-weight: 500;
}

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
  margin: 0.35rem 0.75rem;
  background-color: var(--color-border-default);
  flex-shrink: 0;
}

.nav-rail-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px 4px;
}

.nav-rail-section-label {
  padding: 0.75rem 1.1rem 0.35rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  overflow: hidden;
}

.nav-rail-clear-btn {
  background: none;
  border: none;
  color: var(--color-text-dim);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.nav-rail-clear-btn:hover {
  background-color: var(--color-bg-hover-strong);
  color: var(--color-text-primary);
}

.nav-rail-recent {
  flex: 1;
  overflow-y: auto;
  padding: 0 0.35rem;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-default) transparent;
}

.nav-rail-recent::-webkit-scrollbar {
  width: 6px;
}

.nav-rail-recent::-webkit-scrollbar-track {
  background: transparent;
}

.nav-rail-recent::-webkit-scrollbar-button {
  display: none;
  width: 0;
  height: 0;
}

.nav-rail-recent::-webkit-scrollbar-thumb {
  background-color: var(--color-border-default);
  border-radius: 999px;
  border: none;
  min-height: 28px;
}

.nav-rail-recent::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-border-hover);
}

.nav-rail-recent-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.75rem;
  border-radius: 0.35rem;
  color: var(--color-text-dim);
  text-decoration: none;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
}

.nav-rail-recent-item:hover {
  background-color: var(--color-button-hover-bg);
  color: var(--color-text-primary);
}

.nav-rail-recent-icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
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
  padding: 0.75rem 1.1rem;
  font-size: 0.95rem;
  color: var(--color-text-dim);
  font-style: italic;
}


.recent-views-popover-header {
  padding: 0.75rem 1.1rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border-default);
}

.recent-views-popover-list {
  max-height: 27rem;
  overflow-y: auto;
  padding: 0.35rem;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-default) transparent;
}

.recent-views-popover-list::-webkit-scrollbar {
  width: 6px;
}

.recent-views-popover-list::-webkit-scrollbar-track {
  background: transparent;
}

.recent-views-popover-list::-webkit-scrollbar-button {
  display: none;
  width: 0;
  height: 0;
}

.recent-views-popover-list::-webkit-scrollbar-thumb {
  background-color: var(--color-border-default);
  border-radius: 999px;
  border: none;
  min-height: 28px;
}

.recent-views-popover-list::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-border-hover);
}

.recent-views-popover-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.75rem;
  border-radius: 0.35rem;
  color: var(--color-text-dim);
  text-decoration: none;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
}

.recent-views-popover-item:hover {
  background-color: var(--color-button-hover-bg);
  color: var(--color-text-primary);
}
</style>
