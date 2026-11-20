<script setup>
import Column from 'primevue/column'
import CatBadge from '../common/CatBadge.vue'

defineProps({
  field: String,
  header: String,
  category: {
    type: [String, Number],
    required: true,
  },
})
</script>

<template>
  <Column :field="field" :header="header">
    <template #body="slotProps">
      <div style="display: flex; justify-content: center;">
        <!-- Zero findings leave the cell blank so the eye lands on the counts that matter -->
        <CatBadge
          v-if="Number(slotProps.data[field]) > 0"
          :category="category"
          :count="slotProps.data[field]"
        />
      </div>
    </template>
  </Column>
</template>
