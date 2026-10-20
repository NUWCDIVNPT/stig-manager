<script setup>
import ContextMenu from 'primevue/contextmenu'
import { computed, ref } from 'vue'
import { dataTableCsv } from '../../shared/csv.js'

// Right-click menu for DataTable rows: copy the clicked cell's text, or the
// row as CSV. Wire with `@row-contextmenu="menu.show($event, dt)"`.

const MAX_LABEL_CHARS = 24

const menuRef = ref(null)
const cellText = ref('')
const rowCsv = ref(null)

const items = computed(() => {
  const preview = cellText.value.length > MAX_LABEL_CHARS
    ? `${cellText.value.slice(0, MAX_LABEL_CHARS)}...`
    : cellText.value
  return [
    {
      label: preview ? `Copy value "${preview}"` : 'Copy value',
      icon: 'pi pi-copy',
      disabled: !cellText.value,
      command: () => navigator.clipboard.writeText(cellText.value),
    },
    { separator: true },
    {
      label: 'Copy row as CSV',
      icon: 'pi pi-copy',
      disabled: !rowCsv.value,
      command: () => navigator.clipboard.writeText(rowCsv.value),
    },
  ]
})

// Lighter grey than the table rows so the menu doesn't blend into them.
const menuPt = {
  root: { style: 'background: var(--color-background-light); border: 1px solid var(--color-border-default); border-radius: 4px; box-shadow: 0 6px 24px rgba(0,0,0,0.6); padding: 0.25rem 0;' },
  rootList: { style: 'outline: none;' },
  itemContent: ({ context }) => ({
    style: `color: var(--color-text-primary); border-radius: 0; background: ${context.focused && !context.disabled ? 'var(--color-border-default)' : 'transparent'};`,
  }),
  itemIcon: { style: 'color: var(--color-text-dim);' },
  separator: { style: 'border-top: 1px solid var(--color-border-default); margin: 0.25rem 0;' },
}

/** `event` is the DataTable row-contextmenu payload; `dt` is the DataTable instance. */
function show(event, dt) {
  // Editable cells keep the browser menu so paste still works.
  if (event.originalEvent.target.closest('input, textarea, select, [contenteditable="true"]')) {
    return
  }
  const cell = event.originalEvent.target.closest('td')
  cellText.value = cell?.textContent.replace(/\s+/g, ' ').trim() ?? ''
  rowCsv.value = dataTableCsv(dt, [event.data])
  menuRef.value.show(event.originalEvent)
}

defineExpose({ show })
</script>

<template>
  <ContextMenu ref="menuRef" :model="items" :pt="menuPt" />
</template>
