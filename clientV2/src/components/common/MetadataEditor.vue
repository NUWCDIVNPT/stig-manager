<script setup>
import InputText from 'primevue/inputtext'
import { ref } from 'vue'
import DeleteModal from './DeleteModal.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const deleteModalVisible = ref(false)
const pendingDeleteIndex = ref(null)

function addRow() {
  const arr = [...props.modelValue]
  arr.push({ key: '', value: '' })
  emit('update:modelValue', arr)
}

function confirmRemoveRow(i) {
  const row = props.modelValue[i]
  if (!row.key.trim() && !row.value.trim()) {
    const arr = [...props.modelValue]
    arr.splice(i, 1)
    emit('update:modelValue', arr)
    return
  }
  pendingDeleteIndex.value = i
  deleteModalVisible.value = true
}

function onDeleteConfirmed() {
  const arr = [...props.modelValue]
  arr.splice(pendingDeleteIndex.value, 1)
  emit('update:modelValue', arr)
  pendingDeleteIndex.value = null
}
</script>

<template>
  <div class="metadata-editor">
    <div class="field-header-row">
      <span class="flabel">Metadata</span>
      <button class="meta-add-btn" title="Add metadata key" @click="addRow">
        <i class="pi pi-plus" /> Add
      </button>
    </div>

    <div class="meta-content-area">
      <div class="meta-grid">
        <template v-for="(row, i) in modelValue" :key="i">
          <InputText v-model="row.key" placeholder="Key" class="meta-input" />
          <InputText v-model="row.value" placeholder="Value" class="meta-input" />
          <button class="meta-del" title="Remove" @click="confirmRemoveRow(i)">
            <i class="pi pi-times" />
          </button>
        </template>
        <div v-if="modelValue.length === 0" style="grid-column: 1 / -1; padding: 1.5rem; color: var(--color-text-dim); text-align: center; font-size: 0.85rem; opacity: 0.7;">
          No metadata assigned.
        </div>
      </div>
    </div>
  </div>

  <DeleteModal
    v-model:visible="deleteModalVisible"
    title="Remove Metadata"
    :message="`Remove the '${pendingDeleteIndex !== null ? modelValue[pendingDeleteIndex]?.key || 'this' : 'this'}' metadata key and its value?`"
    @confirm="onDeleteConfirmed"
  />
</template>

<style scoped>
.metadata-editor {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

.field-header-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 0.35rem;
}

.flabel {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  text-transform: none;
  letter-spacing: normal;
}

.meta-content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  background: var(--color-background-light);
  overflow: hidden;
  min-height: 0;
}

.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 0.5rem;
  padding: 0.75rem;
  overflow-y: auto;
  flex: 1;
  align-content: start;
}

.meta-input {
  width: 100%;
  font-size: 0.85rem;
}

.meta-del {
  background: transparent;
  border: none;
  color: var(--color-text-dim);
  cursor: pointer;
  padding: 0.2rem;
  border-radius: 3px;
  font-size: 0.72rem;
  transition: color 0.15s;
  display: flex;
  align-items: center;
}

.meta-del:hover {
  color: #f87171;
}

.meta-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--color-background-dark);
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-size: 1rem;
  font-weight: 550;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
  transition: all 0.15s;
}

.meta-add-btn i {
  font-size: 1rem;
  color: var(--color-text-dim);
}

.meta-add-btn:hover {
  border-color: var(--color-border-hover);
  color: var(--color-text-bright);
}

.meta-add-btn:hover i {
  color: var(--color-text-bright);
}
</style>
