<script setup>
import TieredMenu from 'primevue/tieredmenu'
import { computed, ref } from 'vue'
import lineHeightDown from '../../../assets/line-height-down.svg'
import lineHeightUp from '../../../assets/line-height-up.svg'
import shieldGreenCheck from '../../../assets/shield-green-check.svg'
import Label from '../../../components/common/Label.vue'
import { useChecklistDisplayMode } from '../composables/useChecklistDisplayMode.js'
import { normalizeColor } from '../lib/colorUtils.js'

const props = defineProps({
  headerTitle: {
    type: String,
    default: 'Checklist',
  },
  asset: {
    type: Object,
    default: null,
  },
  accessMode: {
    type: String,
    default: 'r',
  },
  searchFilter: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:searchFilter', 'line-clamp-changed', 'item-size-changed'])

const checklistMenu = ref()

const {
  displayMode,
  lineClamp,
  itemSize,
  increaseRowHeight,
  decreaseRowHeight,
} = useChecklistDisplayMode()

// Watch for internal changes and bubble them if needed, but the composable is global-ish,
// though we'll still emit in case a parent needs to track them explicitly.
// Or actually the parent can just call `useChecklistDisplayMode` itself.

const displayModeMenuItems = computed(() => [
  {
    label: 'Group ID and Rule title',
    icon: displayMode.value === 'groupRule' ? 'pi pi-circle-fill' : 'pi pi-circle',
    command: () => { displayMode.value = 'groupRule' },
  },
  {
    label: 'Group ID and Group title',
    icon: displayMode.value === 'groupGroup' ? 'pi pi-circle-fill' : 'pi pi-circle',
    command: () => { displayMode.value = 'groupGroup' },
  },
  {
    label: 'Rule ID and Rule title',
    icon: displayMode.value === 'ruleRule' ? 'pi pi-circle-fill' : 'pi pi-circle',
    command: () => { displayMode.value = 'ruleRule' },
  },
])

const checklistMenuPT = {
  root: { style: 'background: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 4px; box-shadow: 0 6px 24px rgba(0,0,0,0.6); padding: 0.4rem 0; min-width: 16.5rem; font-family: inherit;' },
  itemContent: { style: 'border-radius: 2px; margin: 0 0.25rem;' },
  itemLink: { style: 'padding: 0.6rem 0.9rem; color: var(--color-text-primary); font-size: 1.05rem; font-weight: 400; gap: 0.65rem; text-decoration: none; transition: background 0.12s;' },
  itemIcon: { style: 'font-size: 1rem; color: var(--color-text-dim);' },
  itemLabel: { style: 'font-size: 1.2rem;' },
  submenuIcon: { style: 'font-size: 0.8rem; color: var(--color-text-dim); margin-left: auto;' },
  submenu: { style: 'background: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 4px; box-shadow: 0 6px 24px rgba(0,0,0,0.6); padding: 0.4rem 0; min-width: 14rem;' },
  separator: { style: 'border: none; border-top: 1px solid var(--color-border-light); margin: 0.35rem 0;' },
}

const checklistMenuItems = computed(() => [
  {
    label: 'Group/Rule display',
    items: displayModeMenuItems.value,
  },
  {
    label: 'Export to file',
    icon: 'pi pi-download',
    items: [
      { label: 'CKL - STIG Viewer v2' },
      { label: 'CKLB - STIG Viewer v3' },
      { label: 'XCCDF' },
      { separator: true },
      { label: 'Attachments Archive' },
    ],
  },
  {
    label: 'Import Results...',
    icon: 'pi pi-upload',
    items: [
      { label: 'CKL' },
      { label: 'CKLB' },
      { label: 'XCCDF' },
    ],
  },
])

function toggleChecklistMenu(event) {
  checklistMenu.value.toggle(event)
}

const maxVisibleLabels = 3
const visibleAssetLabels = computed(() => {
  if (!props.asset?.labels) {
    return []
  }
  return props.asset.labels.slice(0, maxVisibleLabels)
})

const overflowAssetLabelsCount = computed(() => {
  if (!props.asset?.labels) {
    return 0
  }
  return Math.max(0, props.asset.labels.length - maxVisibleLabels)
})

// Provide expose so parent can access these if necessary, though composable covers it.
defineExpose({
  lineClamp,
  itemSize,
})
</script>

<template>
  <div class="checklist-grid__header">
    <div class="checklist-grid__header-top">
      <div class="checklist-grid__title-row">
        <span class="checklist-grid__title">{{ headerTitle }}</span>
        <div v-if="asset" class="checklist-grid__asset-info">
          <span class="asset-info__name">{{ asset.name }}</span>
          <span class="asset-info__id">ID: {{ asset.assetId || asset.id }}</span>
          <span v-if="asset.ip" class="asset-info__ip">IP: {{ asset.ip }}</span>
          <div v-if="asset.labels?.length" class="asset-info__labels">
            <Label v-for="label in visibleAssetLabels" :key="label.name" :value="label.name" :color="normalizeColor(label.color)" />
            <span v-if="overflowAssetLabelsCount > 0" class="asset-info__labels-overflow" :title="asset.labels.slice(maxVisibleLabels).map(l => l.name).join(', ')">
              +{{ overflowAssetLabelsCount }}
            </span>
          </div>
        </div>
      </div>
      <div class="checklist-grid__header-summary">
        <span class="checklist-grid__access-badge" :class="accessMode === 'rw' ? 'access-rw' : 'access-r'">
          <i :class="accessMode === 'rw' ? 'pi pi-pencil' : 'pi pi-lock'" />
          {{ accessMode === 'rw' ? 'Writable' : 'Read only' }}
        </span>
      </div>
    </div>
    <div class="checklist-grid__header-bottom">
      <TieredMenu ref="checklistMenu" :model="checklistMenuItems" :popup="true" :pt="checklistMenuPT" />
      <div class="checklist-grid__header-search">
        <i class="pi pi-search checklist-grid__search-icon" />
        <input
          :value="searchFilter" type="text" class="checklist-grid__search-input" placeholder="Search reviews..."
          @input="emit('update:searchFilter', $event.target.value)"
        >
        <button
          v-if="searchFilter" type="button" class="checklist-grid__search-clear"
          aria-label="Clear review search" @click="emit('update:searchFilter', '')"
        >
          <i class="pi pi-times" />
        </button>
      </div>
      <div class="checklist-grid__header-controls">
        <button
          type="button" class="checklist-grid__menu-btn checklist-grid__menu-btn--checklist"
          aria-haspopup="true" aria-controls="checklist_menu"
          @click="toggleChecklistMenu"
        >
          <img :src="shieldGreenCheck" alt="" class="checklist-grid__menu-shield">
          <span>Checklist</span>
          <i class="pi pi-chevron-down checklist-grid__menu-caret" />
        </button>
        <div class="checklist-grid__density-controls">
          <span class="checklist-grid__density-label">Density</span>
          <button
            class="checklist-grid__icon-btn" title="Decrease row height" :disabled="lineClamp <= 1"
            @click="decreaseRowHeight"
          >
            <img :src="lineHeightDown" alt="Decrease row height">
          </button>
          <button
            class="checklist-grid__icon-btn" title="Increase row height" :disabled="lineClamp >= 10"
            @click="increaseRowHeight"
          >
            <img :src="lineHeightUp" alt="Increase row height">
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checklist-grid__header {
  --checklist-header-height: 5.75rem;
  --checklist-control-height: 2.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0.7rem 0.9rem;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-background-light) 38%, transparent), transparent 75%),
    var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-default);
  flex-shrink: 0;
  gap: 0.75rem;
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

.checklist-grid__header-summary,
.checklist-grid__header-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.checklist-grid__header-search {
  position: relative;
  flex: 1 1 24rem;
  min-width: 0;
  max-width: 42rem;
  height: var(--checklist-control-height);
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
  font-size: 1.02rem;
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

.checklist-grid__menu-btn i:first-child {
  font-size: 0.84rem;
}

.checklist-grid__menu-shield {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.checklist-grid__menu-caret {
  font-size: 0.75rem;
  margin-left: 0.1rem;
}

.checklist-grid__title {
  font-weight: 600;
  font-size: 1.15rem;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.checklist-grid__asset-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 0.5rem;
  padding-left: 0.5rem;
  border-left: 1px solid var(--color-border-default);
  font-size: 1.1rem;
  color: var(--color-text-primary);
  white-space: nowrap;
}

.asset-info__name {
  font-weight: 500;
}

.asset-info__id, .asset-info__ip {
  color: var(--color-text-dim);
}

.asset-info__labels {
  display: flex;
  align-items: center;
  margin-left: 0.25rem;
}

.asset-info__labels-overflow {
  display: inline-block;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 6px;
  background-color: var(--color-background-darkest);
  color: var(--color-text-primary);
  cursor: help;
  margin-left: 3px;
}

.checklist-grid__search-icon {
  position: absolute;
  top: 50%;
  left: 0.75rem;
  transform: translateY(-50%);
  color: var(--color-text-dim);
  font-size: 0.9rem;
  pointer-events: none;
}

.checklist-grid__search-input {
  width: 100%;
  height: 100%;
  padding: 0.32rem 2rem 0.32rem 2.35rem;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  background: color-mix(in srgb, var(--color-background-light) 75%, transparent);
  color: var(--color-text-primary);
  font-size: 1.2rem;
  outline: none;
}

.checklist-grid__search-input:focus {
  border-color: var(--color-primary-highlight);
  background-color: var(--color-background-darkest);
}

.checklist-grid__search-input::placeholder {
  color: var(--color-text-dim);
}

.checklist-grid__search-clear {
  position: absolute;
  top: 50%;
  right: 0.45rem;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.35rem;
  height: 1.35rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--color-text-dim);
  cursor: pointer;
}

.checklist-grid__search-clear:hover {
  color: var(--color-text-primary);
}

.checklist-grid__density-controls {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.3rem 0.2rem 0.65rem;
  border: 1px solid color-mix(in srgb, var(--color-border-default) 85%, transparent);
  border-radius: 5px;
  background: color-mix(in srgb, var(--color-background-light) 45%, transparent);
  height: var(--checklist-control-height);
}

.checklist-grid__density-label {
  font-size: 0.98rem;
  font-weight: 600;
  color: var(--color-text-bright);
  margin-right: 0.2rem;
}

.checklist-grid__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--color-background-light) 25%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-border-light) 40%, transparent);
  border-radius: 5px;
  margin: 0 0.1rem;
  width: 2.1rem;
  height: 2.1rem;
  padding: 0;
  cursor: pointer;
  opacity: 0.9;
}

.checklist-grid__icon-btn:hover:not(:disabled) {
  opacity: 1;
  border-color: var(--color-border-default);
  background: color-mix(in srgb, var(--color-background-light) 75%, transparent);
}

.checklist-grid__icon-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.checklist-grid__icon-btn img {
  width: 17px;
  height: 17px;
}

.checklist-grid__access-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 600;
  font-size: 0.82rem;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  flex-shrink: 0;
  height: var(--checklist-control-height);
}

.checklist-grid__access-badge i {
  font-size: 0.8rem;
}

.access-rw {
  background-color: var(--color-access-rw-bg);
  color: var(--color-access-rw-text);
}

.access-r {
  background-color: var(--color-access-r-bg);
  color: var(--color-access-r-text);
}

@media (max-width: 900px) {
  .checklist-grid__header {
    min-height: unset;
    padding: 0.65rem 0.75rem;
  }

  .checklist-grid__header-top,
  .checklist-grid__header-bottom {
    flex-wrap: wrap;
  }
}

@media (max-width: 640px) {
  .checklist-grid__header {
    padding: 0.55rem 0.6rem;
  }

  .checklist-grid__header-search {
    flex-basis: 100%;
    max-width: none;
  }

  .checklist-grid__header-summary,
  .checklist-grid__header-controls {
    flex-wrap: wrap;
  }
}
</style>
