<script setup>
import { computed } from 'vue'
import collectionSvg from '../../../../../assets/collection.svg'
import lockSvg from '../../../../../assets/lock.svg'
import StatusFooter from '../../../../../components/common/StatusFooter.vue'

const props = defineProps({
  count: { type: Number, default: 0 },
  noun: { type: String, default: 'row' },
  icon: { type: String, default: null },
  iconSrc: { type: String, default: null },
  /** DataTable instance forwarded to StatusFooter for the export action. */
  dt: { type: Object, default: null },
})

const NOUN_ICON_MAP = {
  operation: 'pi pi-bolt',
  user: 'pi pi-user',
  client: 'pi pi-desktop',
  error: 'pi pi-exclamation-triangle',
  projection: 'pi pi-chart-bar',
  group: 'pi pi-users',
  table: 'pi pi-table',
  variable: 'pi pi-sliders-h',
  cpu: 'pi pi-microchip',
  privilege: 'pi pi-shield',
  key: 'pi pi-list',
  item: 'pi pi-list',
  row: 'pi pi-list',
}

const computedIconSrc = computed(() => {
  if (props.iconSrc) { return props.iconSrc }
  const lowerNoun = props.noun?.toLowerCase()
  if (lowerNoun === 'collection') { return collectionSvg }
  if (lowerNoun === 'grant') { return lockSvg }
  return null
})

const computedIcon = computed(() => props.icon || NOUN_ICON_MAP[props.noun?.toLowerCase()] || 'pi pi-list')

const metrics = computed(() => [{
  key: 'count',
  icon: computedIconSrc.value ? undefined : computedIcon.value,
  iconSrc: computedIconSrc.value || undefined,
  value: `${props.count} ${props.count === 1 ? props.noun : `${props.noun}s`}`,
}])
</script>

<template>
  <StatusFooter
    :dt="dt"
    :show-refresh="false"
    :metrics="metrics"
  />
</template>
