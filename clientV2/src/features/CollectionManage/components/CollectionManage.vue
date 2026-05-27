<script setup>
import { computed, ref } from 'vue'
import ManageAssetsTable from './Asset/ManageAssetsTable.vue'
import ManageGrants from './ManageGrants.vue'
import ManageImportOptions from './ManageImportOptions.vue'
import ManageLabels from './ManageLabels.vue'
import ManageMetadata from './ManageMetadata.vue'
import ManageProperties from './ManageProperties.vue'
import ManageSettings from './ManageSettings.vue'
import ManageUsers from './ManageUsers.vue'
import ManageStigsTable from './Stig/ManageStigsTable.vue'

const props = defineProps({
  collectionId: {
    type: [String],
    required: true,
  },
})

const emit = defineEmits(['imported'])

const sections = [
  { label: 'Collection', cards: [
    { key: 'properties', icon: 'pi-building', title: 'Properties', desc: 'Collection name, description, clone & delete' },
    { key: 'settings', icon: 'pi-cog', title: 'Review Settings', desc: 'Review fields, status transitions, history behavior' },
    { key: 'import', icon: 'pi-download', title: 'Import Options', desc: 'Auto-status, unreviewed rules, empty field handling' },
    { key: 'metadata', icon: 'pi-tag', title: 'Metadata', desc: 'Custom key-value pairs for collection tracking' },
  ] },
  { label: 'Access', cards: [
    { key: 'grants', icon: 'pi-shield', title: 'Grants', desc: 'Add, edit, and remove user and group access grants' },
    { key: 'users', icon: 'pi-users', title: 'Effective Users', desc: 'Resolved access including inherited group membership' },
  ] },
  { label: 'Inventory', cards: [
    { key: 'assets', icon: 'pi-server', title: 'Assets', desc: 'Create, import, export, delete, and transfer assets' },
    { key: 'stigs', icon: 'pi-list-check', title: 'STIGs', desc: 'Assign, unassign, and modify STIG assignments & revisions' },
    { key: 'labels', icon: 'pi-bookmark', title: 'Labels', desc: 'Create, edit, and delete labels for tagging assets' },
  ] },
]

const panelComponents = {
  properties: ManageProperties,
  settings: ManageSettings,
  import: ManageImportOptions,
  metadata: ManageMetadata,
  grants: ManageGrants,
  users: ManageUsers,
  assets: ManageAssetsTable,
  stigs: ManageStigsTable,
  labels: ManageLabels,
}

const activePanel = ref(null)

const panelComponent = computed(() => {
  return activePanel.value ? panelComponents[activePanel.value] : null
})

function openPanel(key) {
  activePanel.value = activePanel.value === key ? null : key
}
</script>

<template>
  <div class="manage-layout">
    <div class="cards-col">
      <div v-for="section in sections" :key="section.label" class="manage-section">
        <div class="section-label">
          {{ section.label }}
        </div>
        <div class="cards-list">
          <div
            v-for="card in section.cards"
            :key="card.key"
            class="manage-card"
            :class="{ 'manage-card--active': activePanel === card.key }"
            @click="openPanel(card.key)"
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
      </div>
    </div>

    <div class="panel-col">
      <component
        :is="panelComponent"
        v-if="panelComponent"
        :collection-id="props.collectionId"
        @imported="emit('imported')"
      />
      <div v-else class="panel-empty">
        <i class="pi pi-table panel-empty-icon" />
        <div class="panel-empty-title">
          Select a section
        </div>
        <div class="panel-empty-sub">
          Choose a card on the left to manage this collection
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.manage-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
}

/* ── LEFT: card navigation ── */
.cards-col {
  width: 23rem;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 1.5rem 1rem 1.5rem 1.5rem;
  border-right: 1px solid var(--color-border-default);
}

.cards-col::-webkit-scrollbar { width: 4px; }
.cards-col::-webkit-scrollbar-track { background: transparent; }
.cards-col::-webkit-scrollbar-thumb { background: var(--color-border-default); border-radius: 4px; }

.manage-section {
  margin-bottom: 1.75rem;
}

.section-label {
  font-size: .9rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1rem;
  color: var(--color-text-muted);
  margin-bottom: 0.625rem;
  padding: 0 0.25rem;
}

.cards-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.manage-card {
  background: var(--color-background-subtle);
  border: 1px solid var(--color-border-default);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: border-color 0.12s, box-shadow 0.12s, background 0.12s;
}

.manage-card:hover {
  border-color: var(--p-primary-color);
  background: var(--color-background-hover, var(--color-background-dark));
}

.manage-card--active {
  border-color: var(--p-primary-color);
  box-shadow: 0 0 0 1px var(--p-primary-color);
}

.manage-card-header {
  display: flex;
  align-items: center;
  padding: 0.75rem 0.875rem 0.25rem;
}

.manage-card-title {
  font-weight: 600;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.manage-card-title i {
  color: var(--color-text-dim);
  font-size: 1.1rem;
}

.manage-card--active .manage-card-title i {
  color: var(--p-primary-color);
}

.manage-card-body {
  padding: 0 0.875rem 0.75rem;
}

.manage-card-desc {
  color: var(--color-text-dim);
  font-size: 0.9rem;
  line-height: 1.15;
}

/* ── RIGHT: panel area ── */
.panel-col {
  flex: 1;
  overflow: hidden;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* ── empty state ── */
.panel-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: var(--color-text-muted);
  gap: 0.5rem;
}

.panel-empty-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  opacity: 0.4;
}

.panel-empty-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-dim);
}

.panel-empty-sub {
  font-size: 0.8rem;
}
</style>
