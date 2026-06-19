<script setup>
import SelectButton from 'primevue/selectbutton'
import { computed, ref } from 'vue'

import ManageAssetsTable from './Asset/ManageAssetsTable.vue'
import ManageConfiguration from './Configuration/ManageConfiguration.vue'
import ManageGrants from './ManageGrants.vue'
import ManageLabels from './ManageLabels.vue'
import ManageStigsTable from './Stig/ManageStigsTable.vue'

const props = defineProps({
  collectionId: {
    type: [String],
    required: true,
  },
})

const emit = defineEmits(['imported'])

const selectOptions = ref([
  {
    label: 'Configuration',
    key: 'configuration',
    icon: 'pi pi-sliders-h',
    title: 'Configuration',
    desc: 'Configure properties, review settings, metadata, and import options for this collection.',
  },
  {
    label: 'Users & Grants',
    key: 'grants',
    icon: 'pi pi-users',
    title: 'Users & Grants',
    desc: 'Manage access grants and view effective user permissions for this collection.',
  },
  {
    label: 'Assets',
    key: 'assets',
    icon: 'pi pi-server',
    title: 'Assets',
    desc: 'Manage collection assets, add or import new systems, and view assessment metrics.',
  },
  {
    label: 'STIGs',
    key: 'stigs',
    icon: 'pi pi-list-check',
    title: 'STIGs',
    desc: 'Assign, unassign, and modify STIG assignments and revision rules.',
  },
  {
    label: 'Labels',
    key: 'labels',
    icon: 'pi pi-bookmark',
    title: 'Labels',
    desc: 'Create, edit, and delete labels, and apply them to tag collection assets.',
  },
])

const panelComponents = {
  configuration: ManageConfiguration,
  grants: ManageGrants,
  assets: ManageAssetsTable,
  stigs: ManageStigsTable,
  labels: ManageLabels,
}

const activePanel = ref('configuration')

const panelComponent = computed(() => {
  return activePanel.value ? panelComponents[activePanel.value] : null
})

const activeOption = computed(() => {
  return selectOptions.value.find(opt => opt.key === activePanel.value)
})

const selectButtonPt = {
  root: {
    class: 'manage-select-button',
  },
  button: ({ context }) => ({
    class: [
      'manage-select-btn',
      context.active ? 'manage-select-btn--active' : '',
    ],
  }),
}
</script>

<template>
  <div class="manage-layout">
    <header class="manage-header">
      <div class="header-left">
        <h2 class="page-title">
          {{ activeOption?.title }}
        </h2>
        <p class="page-desc">
          {{ activeOption?.desc }}
        </p>
      </div>

      <SelectButton
        v-model="activePanel"
        :options="selectOptions"
        option-label="label"
        option-value="key"
        :allow-empty="false"
        class="flex-shrink-0"
        :pt="selectButtonPt"
      >
        <template #option="slotProps">
          <div class="option-content">
            <i class="option-icon" :class="slotProps.option.icon" />
            <span>{{ slotProps.option.label }}</span>
          </div>
        </template>
      </SelectButton>
    </header>

    <div class="panel-col">
      <Transition name="fade" mode="out-in">
        <component
          :is="panelComponent"
          v-if="panelComponent"
          :key="activePanel"
          :collection-id="props.collectionId"
          @imported="emit('imported')"
        />
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.manage-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.manage-header {
  background-color: var(--color-background-dark);
  padding: 1rem 2rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.page-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--color-text-bright);
  margin: 0;
}

.page-desc {
  color: var(--color-text-dim);
  font-weight: 500;
  font-size: 1.05rem;
  margin: 0;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.05rem;
  font-weight: 600;
}

.option-icon {
  font-size: 1.05rem;
  opacity: 0.8;
}

.manage-select-button {
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  background-color: var(--color-background-light);
  display: inline-flex;
  overflow: hidden;
}

.manage-select-btn {
  background: transparent;
  border: none;
  color: var(--color-text-dim);
  padding: 0.65rem 1.2rem;
  font-size: 1.05rem;
  border-radius: 0;
  transition: all 0.15s ease;
  box-shadow: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.manage-select-btn:not(:last-child) {
  border-right: 1px solid var(--color-border-default);
}

.manage-select-btn:hover {
  background-color: var(--color-background-subtle);
  color: var(--color-text-bright);
}

.manage-select-btn--active {
  background-color: color-mix(in srgb, var(--color-primary) 15%, transparent) !important;
  color: var(--color-primary-highlight-light) !important;
}

.panel-col {
  flex: 1;
  overflow: auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.fade-enter-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.fade-leave-active {
  transition: none;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
</style>
