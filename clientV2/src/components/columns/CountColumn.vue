<script setup>
import Column from 'primevue/column'
import { computed, getCurrentInstance } from 'vue'
import { dashZero } from '../../shared/lib/numberFormat.js'
import { LIST_TOOLTIP_PT } from '../../shared/lib/tooltips.js'

const props = defineProps({
  field: String,
  header: String,
  // row => string[] shown one per line on hover (e.g. the STIG names behind a STIG count)
  tooltipValues: Function,
})

// field may be a dotted path (statistics.userCount), as Column sorting allows
const path = computed(() => props.field.split('.'))

function valueOf(data) {
  return path.value.reduce((obj, key) => obj?.[key], data)
}

// DataTable only finds a wrapped Column through the wrapper vnode's key, and
// silently drops the column otherwise.
if (import.meta.env.DEV && getCurrentInstance()?.vnode.key == null) {
  console.warn(`CountColumn "${props.field}" needs a key attr (e.g. key="${props.field}") or DataTable will not render it`)
}
</script>

<template>
  <Column :field="field" :header="header">
    <template #body="{ data }">
      <span v-if="tooltipValues" v-tooltip.top="{ value: (tooltipValues(data) ?? []).join('\n'), pt: LIST_TOOLTIP_PT }">
        {{ dashZero(valueOf(data)) }}
      </span>
      <template v-else>
        {{ dashZero(valueOf(data)) }}
      </template>
    </template>
  </Column>
</template>
