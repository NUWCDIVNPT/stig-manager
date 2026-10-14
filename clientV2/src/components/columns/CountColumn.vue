<script setup>
// Give each direct use a key (e.g. key="grantCount"): DataTable only finds a
// wrapped Column through the wrapper vnode's key.
import Column from 'primevue/column'
import { dashZero } from '../../shared/lib/numberFormat.js'

defineProps({
  field: String,
  header: String,
})

// field may be a dotted path (statistics.userCount), as Column sorting allows
function valueOf(data, field) {
  return field.split('.').reduce((obj, key) => obj?.[key], data)
}
</script>

<template>
  <Column :field="field" :header="header">
    <template #body="{ data }">
      {{ dashZero(valueOf(data, field)) }}
    </template>
  </Column>
</template>
