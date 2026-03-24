<script setup>
import Popover from 'primevue/popover'
import { ref } from 'vue'
import { useNavItems } from '../composables/useNavItems.js'
import { useRecentViews } from '../composables/useRecentViews.js'

defineProps({
  expanded: {
    type: Boolean,
    required: true,
  },
})

const { recentViews, clearViews } = useRecentViews()
const { typeIcon } = useNavItems()

const recentViewsPopover = ref(null)

const recentViewsPopoverPt = {
  root: { style: 'min-width: 20rem; max-width: 27rem' },
}

function toggleRecentViewsPopover(event) {
  recentViewsPopover.value.toggle(event)
}
</script>

<template>
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
    <div class="nav-rail-recent nav-scroller">
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
      <div class="recent-views-popover-list nav-scroller">
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
</template>

<style scoped>
@import './style.css';

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
