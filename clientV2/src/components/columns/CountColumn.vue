<script setup>
import Column from 'primevue/column'
import { dashZero } from '../../shared/lib/numberFormat.js'

defineProps({
  field: String,
  header: String,
})
</script>

<template>
  <Column :field="field" :header="header">
    <template #body="{ data }">
      {{ dashZero(data[field]) }}
    </template>
  </Column>
</template>
