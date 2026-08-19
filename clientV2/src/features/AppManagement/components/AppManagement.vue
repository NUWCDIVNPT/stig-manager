<script setup>
import { useAppManagementItems } from '../composables/useAppManagementItems.js'

// Single source of truth: same list drives this side-nav and the landing grid.
const { appManagementItems } = useAppManagementItems()
</script>

<template>
  <div class="admin-shell">
    <nav class="admin-nav" aria-label="App Management sections">
      <router-link
        v-for="item in appManagementItems"
        :key="item.key"
        class="admin-nav-item"
        :to="{ name: item.routeName }"
        active-class="is-active"
      >
        <span class="icon-bg" :class="item.icon" />
        <span>{{ item.label }}</span>
      </router-link>
    </nav>

    <main class="admin-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.admin-shell {
  display: flex;
  height: 100%;
  min-height: 0;
  background-color: var(--color-background-dark);
  color: var(--color-text-primary);
}

.admin-nav {
  flex: 0 0 220px;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem 0.75rem;
  border-right: 1px solid var(--color-border-default);
  overflow-y: auto;
}

.admin-nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  border-radius: 6px;
  text-decoration: none;
  color: var(--color-text-primary);
  font-size: 0.95rem;
  transition: background-color 0.15s ease;
}

.admin-nav-item:hover {
  background: var(--color-bg-hover);
}

.admin-nav-item.is-active {
  background: var(--color-bg-hover-strong);
  font-weight: 600;
}

/* Same icon treatment as the landing cards for visual continuity. */
.icon-bg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}

.icon-user,
.icon-user-group,
.icon-green-shield,
.icon-wrench,
.icon-info-circle,
.icon-database {
  background-image: url('/src/assets/gear.svg');
}

.icon-collection {
  background-image: url('/src/assets/collection.svg');
}

.admin-content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
}
</style>
