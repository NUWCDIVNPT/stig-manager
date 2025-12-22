<script setup>
import { useStigLibraryItems } from '../composeables/useStigLibraryItems.js'

const { stigLibraryItems: STIG_LIBRARY_ITEMS } = useStigLibraryItems()

function getRoute(item) {
  return item.routeName ? { name: item.routeName } : null
}
</script>

<template>
  <div class="selection-page">
    <div class="header">
      <h1>STIG Library</h1>
    </div>

    <div class="grid">
      <router-link
        v-for="item in STIG_LIBRARY_ITEMS"
        :key="item.key"
        class="card"
        :to="getRoute(item) || { name: 'library' }"
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
  background-color: #18181b;
  color: #e4e4e7;
}

.header {
  margin-bottom: 2rem;
}

h1 {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
  color: #fff;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.card {
  background: #27272a;
  border: 1px solid #3f3f46;
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;
  text-decoration: none; /* No underline */
  color: inherit;
}

.card:hover {
  background: #3f3f46;
  border-color: #52525b;
  transform: translateY(-2px);
}

.card-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-bg {
  width: 24px;
  height: 24px;
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}

.icon-folder {
  background-image: url('/src/assets/library.svg');
}

.card-content {
  flex: 1;
}

.card-content h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
}

.card-arrow {
  color: #52525b;
}

.card:hover .card-arrow {
  color: #e4e4e7;
}
</style>
