<script setup>
import TieredMenu from 'primevue/tieredmenu'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import shieldGreenCheck from '../../../assets/shield-green-check.svg'
import ColumnToggle from '../../../components/common/ColumnToggle.vue'
import DensityControls from '../../../components/common/DensityControls.vue'
import GridSearch from '../../../components/common/GridSearch.vue'
import { fetchStigRevisions } from '../../../shared/api/stigsApi.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { getRevisionInfo } from '../../../shared/lib/checklistUtils.js'

defineProps({
  toggleableColumns: {
    type: Array,
    required: true,
  },
})

const searchFilter = defineModel('searchFilter', { type: String, default: '' })
const selectedColumns = defineModel('selectedColumns', { type: Array, required: true })
const displayMode = defineModel('displayMode', { type: String, required: true })

const route = useRoute()
const benchmarkId = computed(() => route.params.benchmarkId)
const revisionStr = computed(() => route.params.revisionStr)

const { state: stigRevisions, execute: loadStigRevisions } = useAsyncState(
  () => fetchStigRevisions(benchmarkId.value),
  { immediate: false, initialState: [] },
)

onMounted(() => {
  if (benchmarkId.value) {
    loadStigRevisions()
  }
})

const revisionInfo = computed(() => getRevisionInfo(revisionStr.value, stigRevisions.value))

const headerTitle = computed(() => {
  if (benchmarkId.value && revisionInfo.value?.display) {
    return `${benchmarkId.value} - ${revisionInfo.value.display}`
  }
  return benchmarkId.value || 'Collection Checklist'
})

const checklistMenu = ref()
const checklistMenuItems = computed(() => [
  {
    label: 'Group/Rule Display',
    icon: 'pi pi-list',
    items: [
      {
        label: 'Group ID and Rule Title',
        icon: displayMode.value === 'groupRule' ? 'pi pi-circle-fill' : 'pi pi-circle',
        command: () => { displayMode.value = 'groupRule' },
      },
      {
        label: 'Group ID and Group Title',
        icon: displayMode.value === 'groupGroup' ? 'pi pi-circle-fill' : 'pi pi-circle',
        command: () => { displayMode.value = 'groupGroup' },
      },
      {
        label: 'Rule ID and Rule Title',
        icon: displayMode.value === 'ruleRule' ? 'pi pi-circle-fill' : 'pi pi-circle',
        command: () => { displayMode.value = 'ruleRule' },
      },
    ],
  },
  {
    label: 'Export Result Archive',
    icon: 'pi pi-download',
    items: [
      { label: 'CKL (STIG Viewer v2)', icon: 'pi pi-download' },
      { label: 'CKLB (STIG Viewer v3)', icon: 'pi pi-download' },
      { label: 'XCCDF', icon: 'pi pi-download' },
    ],
  },
])

const checklistMenuPT = {
  root: { style: 'background: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 4px; box-shadow: 0 6px 24px rgba(0,0,0,0.6); padding: 0.25rem 0; min-width: 12rem;' },
  menu: { style: 'background: transparent; outline: none;' },
  menuitem: { style: 'margin: 0;' },
  content: { style: 'padding: 0.4rem 0.8rem; color: var(--color-text-primary); border-radius: 0; transition: background-color 0.1s; display: flex; align-items: center;' },
  icon: { style: 'color: var(--color-text-dim); margin-right: 0.5rem; font-size: var(--text-md);' },
  label: { style: 'font-size: var(--text-md);' },
  separator: { style: 'border-top: 1px solid var(--color-border-light); margin: 0.25rem 0;' },
  submenuIcon: { style: 'color: var(--color-text-dim); font-size: var(--icon-xs); margin-left: auto;' },
}

function toggleChecklistMenu(event) {
  checklistMenu.value.toggle(event)
}
</script>

<template>
  <div class="checklist-grid__header">
    <div class="checklist-grid__header-top">
      <div class="checklist-grid__title-row">
        <span class="checklist-grid__title">{{ headerTitle }}</span>
      </div>
    </div>

    <div class="checklist-grid__header-bottom">
      <TieredMenu ref="checklistMenu" :model="checklistMenuItems" :popup="true" :pt="checklistMenuPT" />
      <GridSearch v-model="searchFilter" class="checklist-grid__header-search" label="Search rules" />

      <div class="checklist-grid__header-controls">
        <button
          type="button" class="checklist-grid__menu-btn checklist-grid__menu-btn--checklist"
          aria-haspopup="true" aria-controls="checklist_menu" @click="toggleChecklistMenu"
        >
          <img :src="shieldGreenCheck" alt="" class="checklist-grid__menu-shield">
          <span>Checklist</span>
          <i class="pi pi-chevron-down checklist-grid__menu-caret" />
        </button>

        <ColumnToggle v-model="selectedColumns" :columns="toggleableColumns" />

        <DensityControls grid-key="collection-checklist" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.checklist-grid__header {
  --checklist-header-height: 7.3rem;
  --checklist-control-height: 2.42rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0.75rem 1rem;
  background: linear-gradient(180deg, var(--color-background-light), var(--color-background-dark));
  border-bottom: 1px solid var(--color-border-default);
  flex-shrink: 0;
  gap: 0.85rem;
  min-height: var(--checklist-header-height);
}

.checklist-grid__header-top,
.checklist-grid__header-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 0.75rem;
}

.checklist-grid__header-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.checklist-grid__header-search {
  flex: 1 1 24rem;
  max-width: 42rem;
}

.checklist-grid__title-row {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: nowrap;
  min-width: 0;
}

.checklist-grid__menu-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 1.15rem;
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--color-text-bright);
  flex-shrink: 0;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  background: color-mix(in srgb, var(--color-background-light) 45%, transparent);
  height: var(--checklist-control-height);
}

.checklist-grid__menu-btn:hover {
  background: color-mix(in srgb, var(--color-background-light) 85%, transparent);
}

.checklist-grid__menu-btn--checklist {
  min-width: 9rem;
}

.checklist-grid__menu-shield {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.checklist-grid__menu-caret {
  font-size: var(--icon-xs);
  margin-left: 0.1rem;
}

.checklist-grid__title {
  font-weight: 600;
  font-size: var(--text-lg);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
</style>
