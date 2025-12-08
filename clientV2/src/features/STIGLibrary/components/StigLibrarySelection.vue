<script setup>
import { computed } from 'vue'
// import { useRouter } from 'vue-router'
import { navTreeConfig } from '../../NavTree/composeables/navTreeConfig'
// const router = useRouter()

const stigLibraryConfig = computed(() => {
  return navTreeConfig.sections.find(s => s.key === 'Stig')
})

const children = computed(() => {
  return stigLibraryConfig.value?.children || []
})

// STIG Library children components don't have direct named routes usually,
// they often point to 'library' route but maybe with query params or they *should* have sub-routes.
// Looking at router/index.js, there is only '/library' -> StigLibrary.
// And NavTreeConfig items are: StigAE, StigFM, etc.
// The current NavTree implementation likely handles this via 'StigLibrary' component logic or props?
// Let's check how NavTreeContent handles 'StigLibary' children.
// Ah, checking 'componentToRoute' in NavTreeContent:
// StigLibrary: 'library'
// But the children (StigAE, etc) don't seem to have mappings.
// Wait, in `navTreeConfig.js`, the children have `component: 'StigAE'`, etc.
// In `NavTreeContent.vue`, `getNodeRoute` uses `componentToRoute`.
// `StigAE`, `StigFM` are NOT in `componentToRoute`.
// This implies that currently, clicking them in the tree might not do anything specific or
// they are just organizational folders??
// No, the user said "stig library ... main route then it shows the sub ones".
// If the existing children don't point to unique routes, then clicking them in the current tree relies on something else?
// Or maybe they act as filters on the library page?
// Let's assume for now they all go to '/library' (StigLibrary component) but maybe we pass the key as a prop or query.
// However, looking at the previous NavTree, let's see if there is any special handling.
// There isn't. `getNodeRoute` would return null for `StigAE` etc.
// So they might be just expandable folders in the current tree?
// Since I don't see sub-routes for STIGs, I will make them all redirect to `/library` for now
// possibly with a query param like `?group=AE`.
</script>

<template>
  <div class="selection-page">
    <div class="header">
      <h1>{{ stigLibraryConfig?.label }}</h1>
    </div>

    <div class="grid">
      <router-link
        v-for="item in children"
        :key="item.key"
        class="card"
        :to="{ name: 'library' }"
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
