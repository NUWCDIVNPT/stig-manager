<script setup>
import { computed, ref } from 'vue'
import ManageAssets from './ManageAssets.vue'
import ManageGrants from './ManageGrants.vue'
import ManageImportOptions from './ManageImportOptions.vue'
import ManageLabels from './ManageLabels.vue'
import ManageMetadata from './ManageMetadata.vue'
import ManageProperties from './ManageProperties.vue'
import ManageSettings from './ManageSettings.vue'
import ManageStigs from './ManageStigs.vue'
import ManageUsers from './ManageUsers.vue'

const props = defineProps({
  collectionId: {
    type: [String],
    required: true,
  },
})

const sections = [
  { label: 'Collection', cards: [
    { key: 'properties', icon: 'pi-home', title: 'Properties', desc: 'Collection name, description, clone & delete' },
    { key: 'settings', icon: 'pi-cog', title: 'Review Settings', desc: 'Review fields, status, history configuration' },
    { key: 'import', icon: 'pi-download', title: 'Import Options', desc: 'Auto-status, unreviewed rules, empty field handling' },
    { key: 'metadata', icon: 'pi-tags', title: 'Metadata', desc: 'Custom key-value pairs for collection tracking' },
  ] },
  { label: 'Access', cards: [
    { key: 'grants', icon: 'pi-shield', title: 'Grants', desc: 'Add, edit, remove user and group access grants' },
    { key: 'users', icon: 'pi-users', title: 'Effective Users', desc: 'View resolved user access including group membership' },
  ] },
  { label: 'Inventory', cards: [
    { key: 'assets', icon: 'pi-server', title: 'Assets', desc: 'Create, import, export, delete, transfer assets' },
    { key: 'stigs', icon: 'pi-list-check', title: 'STIGs', desc: 'Assign, unassign, modify STIG assignments & revisions' },
    { key: 'labels', icon: 'pi-bookmark', title: 'Labels', desc: 'Create, edit, delete labels and tag assets' },
  ] },
]

const drawerComponents = {
  properties: ManageProperties,
  settings: ManageSettings,
  import: ManageImportOptions,
  metadata: ManageMetadata,
  grants: ManageGrants,
  users: ManageUsers,
  assets: ManageAssets,
  stigs: ManageStigs,
  labels: ManageLabels,
}

const activeDrawer = ref(null)

const drawerComponent = computed(() => {
  if (activeDrawer.value) {
    return drawerComponents[activeDrawer.value]
  }
  return null
})

const drawerTitle = computed(() => {
  if (!activeDrawer.value) {
    return ''
  }
  for (const section of sections) {
    const card = section.cards.find(c => c.key === activeDrawer.value)
    if (card) {
      return card.title
    }
  }
  return ''
})

function openDrawer(key) {
  activeDrawer.value = activeDrawer.value === key ? null : key
}

function closeDrawer() {
  activeDrawer.value = null
}
</script>

<template>
  <div class="manage-layout">
    <div class="card-area">
      <template v-for="section in sections" :key="section.label">
        <div class="section-label">
          {{ section.label }}
        </div>
        <div class="card-grid">
          <div
            v-for="card in section.cards"
            :key="card.key"
            class="manage-card"
            :class="{ 'manage-card--active': activeDrawer === card.key }"
            @click="openDrawer(card.key)"
          >
            <div class="manage-card-header">
              <span class="manage-card-title">
                <i class="pi" :class="card.icon" />
                {{ card.title }}
              </span>
            </div>
            <div class="manage-card-body">
              <span class="manage-card-desc">{{ card.desc }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <Transition name="drawer">
      <div v-if="activeDrawer" class="manage-drawer">
        <div class="manage-drawer-header">
          <span class="manage-drawer-title">{{ drawerTitle }}</span>
          <button class="manage-drawer-close" @click="closeDrawer">
            <i class="pi pi-times" />
          </button>
        </div>
        <div class="manage-drawer-body">
          <component
            :is="drawerComponent"
            :collection-id="props.collectionId"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.manage-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.card-area {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.section-label {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  margin-bottom: 0.6rem;
  margin-top: 1.25rem;
}

.section-label:first-child {
  margin-top: 0;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
  gap: 0.75rem;
}

.manage-card {
  background: var(--color-background-dark);
  border: 1px solid var(--color-border-default);
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.manage-card:hover {
  border-color: var(--p-primary-color);
  box-shadow: 0 0 0 1px var(--p-primary-color);
}

.manage-card--active {
  border-color: var(--p-primary-color);
  box-shadow: 0 0 0 1px var(--p-primary-color);
}

.manage-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.8rem;
  border-bottom: 1px solid var(--color-border-default);
}

.manage-card-title {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.manage-card-title i {
  color: var(--color-text-dim);
}

.manage-card-body {
  padding: 0.6rem 0.8rem;
  flex: 1;
}

.manage-card-desc {
  color: var(--color-text-dim);
  line-height: 1.4;
}

/* Drawer */
.manage-drawer {
  width: 80rem;
  max-width: 70vw;
  flex-shrink: 0;
  background: var(--color-background-dark);
  border-left: 1px solid var(--color-border-default);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.manage-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.9rem;
  border-bottom: 1px solid var(--color-border-default);
  flex-shrink: 0;
}

.manage-drawer-title {
  font-weight: 700;
}

.manage-drawer-close {
  background: none;
  border: none;
  color: var(--color-text-dim);
  cursor: pointer;
  padding: 0.3rem;
  border-radius: 0.3rem;
}

.manage-drawer-close:hover {
  background: var(--color-button-hover-bg);
  color: var(--color-text-primary);
}

.manage-drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.9rem;
}

/* Drawer transition */
.drawer-enter-active,
.drawer-leave-active {
  transition: width 0.2s ease, opacity 0.2s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  width: 0;
  opacity: 0;
}
</style>
