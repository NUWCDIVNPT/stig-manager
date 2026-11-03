<script setup>
import ContextMenu from 'primevue/contextmenu'
import { computed, onBeforeUnmount, ref } from 'vue'
import { dataTableCellText, dataTableCsv } from '../../shared/csv.js'
import { registerGridCopyMenu, unregisterGridCopyMenu } from '../../shared/lib/gridCopyMenu.js'

// Right-click menu for DataTable rows: copy the clicked cell's text, or the
// row as CSV. Mounted once in App.vue; the global DataTable pass-through in
// primevueTheme.js opens it for every table via showGridCopyMenu().

const MAX_LABEL_CHARS = 24

const menuRef = ref(null)
const cellText = ref('')
const rowCsv = ref(null)

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
  }
  catch {
    // Clipboard is unavailable on insecure origins or when permission is
    // denied; the menu is a convenience, so fail quietly.
  }
}

const items = computed(() => {
  const preview = cellText.value.length > MAX_LABEL_CHARS
    ? `${cellText.value.slice(0, MAX_LABEL_CHARS)}...`
    : cellText.value
  return [
    {
      label: preview ? `Copy value "${preview}"` : 'Copy value',
      icon: 'pi pi-copy',
      disabled: !cellText.value,
      command: () => copy(cellText.value),
    },
    { separator: true },
    {
      label: 'Copy row as CSV',
      icon: 'pi pi-copy',
      disabled: !rowCsv.value,
      command: () => copy(rowCsv.value),
    },
  ]
})

// Lighter grey than the table rows so the menu doesn't blend into them.
const menuPt = {
  root: { style: 'background: var(--color-background-light); border: 1px solid var(--color-border-default); border-radius: 4px; box-shadow: var(--shadow-popup); padding: 0.25rem 0;' },
  rootList: { style: 'outline: none;' },
  itemContent: ({ context }) => ({
    style: `color: var(--color-text-primary); border-radius: 0; background: ${context.focused && !context.disabled ? 'var(--color-border-default)' : 'transparent'};`,
  }),
  itemIcon: { style: 'color: var(--color-text-dim);' },
  separator: { style: 'border-top: 1px solid var(--color-border-default); margin: 0.25rem 0;' },
}

// True when the user has drag-selected text inside `cell`'s table, in which
// case the browser menu (with its own Copy) is the better one to show.
function hasTextSelectionIn(cell) {
  const sel = window.getSelection?.()
  if (!sel || sel.isCollapsed || !sel.anchorNode) {
    return false
  }
  const table = cell?.closest('table')
  return Boolean(table?.contains(sel.anchorNode))
}

// Prefer the column's export text (same rules as the CSV) so chips, badges
// and formatted values copy as the data rather than as concatenated DOM text;
// fall back to the rendered text for columns with no field or export-value.
function cellValueText(cell, rowData, dt) {
  const rendered = cell?.cellIndex ?? -1
  const columns = (dt?.columns ?? []).filter(col => !dt.columnProp(col, 'hidden'))
  const col = rendered >= 0 ? columns[rendered] : null
  const exported = col ? dataTableCellText(dt, col, rowData) : null
  return exported || (cell?.textContent.replace(/\s+/g, ' ').trim() ?? '')
}

/**
 * @param {MouseEvent} event native contextmenu event from a body row
 * @param {object} rowData the row's record
 * @param {object} dt the DataTable component instance
 */
function show(event, rowData, dt) {
  // Editable cells keep the browser menu so paste still works.
  if (event.target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) {
    return
  }
  const cell = event.target.closest('td')
  if (hasTextSelectionIn(cell)) {
    return
  }
  cellText.value = cellValueText(cell, rowData, dt)
  rowCsv.value = dataTableCsv(dt, [rowData])
  menuRef.value.show(event)
}

const api = { show }
registerGridCopyMenu(api)
onBeforeUnmount(() => unregisterGridCopyMenu(api))

defineExpose({ show })
</script>

<template>
  <ContextMenu ref="menuRef" :model="items" :pt="menuPt" />
</template>
