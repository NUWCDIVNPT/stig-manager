<script setup>
import { useAppManagementItems } from '../composables/useAppManagementItems.js'

const { appManagementItems: APP_MANAGEMENT_ITEMS } = useAppManagementItems()

function getRoute(item) {
  return item.routeName ? { name: item.routeName } : null
}
</script>

<template>
  <div class="selection-page">
    <div class="header">
      <h1>App Management</h1>
    </div>

    <div class="grid">
      <router-link
        v-for="item in APP_MANAGEMENT_ITEMS"
        :key="item.key"
        class="card"
        :to="getRoute(item) || '#'"
      >
        <div class="card-icon">
          <div class="icon-bg" :class="item.icon" />
        </div>
        <div class="card-content">
          <h3>{{ item.label }}</h3>
        </div>
        <div class="card-arrow">
          <i class="pi pi-chevron-right" />
        </div>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.selection-page {
  padding: 2rem;
  height: 100%;
  overflow-y: auto;
  background-color: var(--color-background-dark);
  color: var(--color-text-primary);
}

.card {
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;
  text-decoration: none;
  color: inherit;
}

.card:hover {
  background: var(--color-bg-hover-strong);
  border-color: #52525b;
  transform: translateY(-2px);
}

.card-icon {
  width: 48px;
  height: 48px;
  background: var(--color-bg-hover);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Similar icon styles to NavTreeContent/NavTree */
.icon-bg {
  width: 24px;
  height: 24px;
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}

.icon-app-management,
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

.card-content {
  flex: 1;
}

.card-content h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.card-arrow {
  color: var(--color-text-dim);
}

.card:hover .card-arrow {
  color: var(--color-text-primary);
}
</style>
