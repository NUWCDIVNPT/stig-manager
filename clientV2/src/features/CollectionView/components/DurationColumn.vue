<script setup>
import Column from 'primevue/column'

defineProps({
  field: String,
  header: String,
  tooltipX: String,
})

function durationToNow(date) {
  if (!date) {
    return '-'
  }
  if (!(date instanceof Date)) {
    date = new Date(date)
  }
  let d = Math.abs(date - new Date()) / 1000 // delta
  const r = {} // result
  const s = { // structure
    // year: 31536000,
    // month: 2592000,
    // week: 604800, // uncomment row to ignore
    day: 86400, // feel free to add your own row
    hour: 3600,
    minute: 60,
    second: 1,
  }

  Object.keys(s).forEach((key) => {
    r[key] = Math.floor(d / s[key])
    d -= r[key] * s[key]
  })
  let durationStr = r.day > 0 ? `${r.day} d` : r.hour > 0 ? `${r.hour} h` : r.minute > 0 ? `${r.minute} m` : `now`
  return durationStr
}
</script>

<template>
  <Column :field="field" :header="header">
    <template #body="slotProps">
      {{ durationToNow(slotProps.data[slotProps.field]) }}
      {{ tooltipX }}
    </template>
  </Column>
</template>

<style scoped>
</style>
