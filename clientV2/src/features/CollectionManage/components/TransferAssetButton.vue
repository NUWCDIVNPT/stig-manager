<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Menu from 'primevue/menu'
import { computed, ref, toRef } from 'vue'
import ErrorListDialog from '../../../components/common/ErrorListDialog.vue'
import { useAssetTransfer } from '../composables/useAssetTransfer.js'

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
  selectedAssets: {
    type: Array,
    default: () => [],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['assets-transferred'])

const menuRef = ref(null)
const confirmVisible = ref(false)
const resultsVisible = ref(false)

const {
  destinationCollections,
  pendingDestination,
  transferFailures,
  isTransferring,
  triggerLabel,
  confirmMessage,
  transfer,
} = useAssetTransfer({
  collectionId: toRef(props, 'collectionId'),
  selectedAssets: toRef(props, 'selectedAssets'),
})

const menuItems = computed(() => {
  if (destinationCollections.value.length === 0) {
    return [{ label: 'No eligible destinations', disabled: true }]
  }
  return destinationCollections.value.map(collection => ({
    label: collection.name,
    icon: 'pi pi-th-large',
    command: () => onSelect(collection),
  }))
})

const menuPt = {
  root: { style: 'background: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 4px; box-shadow: 0 6px 24px rgba(0,0,0,0.6); padding: 0.25rem 0; min-width: 12rem;' },
  menu: { style: 'background: transparent; outline: none;' },
  menuitem: { style: 'margin: 0;' },
  content: { style: 'padding: 0.4rem 0.8rem; color: var(--color-text-primary); border-radius: 0; transition: background-color 0.1s; display: flex; align-items: center;' },
  icon: { style: 'color: var(--color-text-dim); margin-right: 0.5rem; font-size: 0.92rem;' },
  label: { style: 'font-size: 0.92rem;' },
  separator: { style: 'border-top: 1px solid var(--color-border-light); margin: 0.25rem 0;' },
}

function toggleMenu(event) {
  if (props.disabled || isTransferring.value) {
    return
  }
  menuRef.value?.toggle(event)
}

function onSelect(collection) {
  pendingDestination.value = collection
  confirmVisible.value = true
}

async function onTransferConfirmed() {
  confirmVisible.value = false
  const transferred = await transfer()
  if (transferred.length > 0) {
    emit('assets-transferred', transferred)
  }
  if (transferFailures.value.length > 0) {
    resultsVisible.value = true
  }
}
</script>

<template>
  <button
    type="button"
    class="transfer-trigger"
    :class="{ 'is-disabled': disabled || isTransferring }"
    :disabled="disabled || isTransferring"
    aria-haspopup="true"
    @click="toggleMenu"
  >
    <i class="pi pi-th-large icon-grey" />
    <span class="trigger-label">{{ triggerLabel }}</span>
    <i class="pi pi-chevron-down trigger-caret" />
  </button>

  <Menu
    ref="menuRef"
    :model="menuItems"
    :popup="true"
    :pt="menuPt"
  />

  <ErrorListDialog
    v-model:visible="resultsVisible"
    title="Transfer Incomplete"
    message="The following assets could not be transferred:"
    :errors="transferFailures"
  />

  <Dialog
    v-model:visible="confirmVisible"
    header="Transfer Assets"
    :modal="true"
    :style="{ width: '420px' }"
  >
    <div class="confirm-content">
      <i class="pi pi-exclamation-triangle warning-icon" />
      <div class="confirm-text">
        <p>{{ confirmMessage }}</p>
        <p>Do you wish to continue?</p>
      </div>
    </div>
    <template #footer>
      <Button label="Cancel" icon="pi pi-times" text @click="confirmVisible = false" />
      <Button label="Transfer" icon="pi pi-arrow-right" @click="onTransferConfirmed" />
    </template>
  </Dialog>
</template>

<style scoped>
.transfer-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.7rem;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--color-text-default);
  font-size: 0.92rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.1s, color 0.1s;
}

.transfer-trigger:hover:not(.is-disabled) {
  background: var(--color-background-subtle);
  color: var(--color-text-bright);
}

.transfer-trigger.is-disabled {
  opacity: 0.35;
  cursor: default;
}

.icon-grey {
  color: var(--color-text-dim);
  font-size: 0.92rem;
}

.trigger-caret {
  color: var(--color-text-dim);
  font-size: 0.7rem;
  margin-left: 0.1rem;
}

.confirm-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.confirm-text {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.confirm-text p {
  margin: 0;
}

.warning-icon {
  font-size: 2rem;
  color: var(--color-text-warning, #f59e0b);
  flex-shrink: 0;
}

:deep(.p-menu-item-content:hover) {
  background: var(--color-background-subtle);
}
</style>
