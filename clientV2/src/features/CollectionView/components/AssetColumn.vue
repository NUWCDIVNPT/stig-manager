<script setup>
import Column from 'primevue/column'
import shieldGreenCheck from '../../../assets/shield-green-check.svg'

defineProps({
  field: String,
  header: String
})
</script>

<template>
  <Column :field="field" :header="header">
    <template #body="slotProps">
      <div class="sm-grid-cell-with-toolbar">
        <div class="sm-info">{{ slotProps.data.assetName }}</div>
        <div class="sm-static-width">
          <img :src="shieldGreenCheck" width="14" height="14" />
        </div>
      </div>
    </template>
  </Column>
</template>

<style scoped>
.sm-grid-cell-with-toolbar {
  display: flex;
  align-items: center;
}
.sm-info {
  flex: 1;
}
.sm-static-width {
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
