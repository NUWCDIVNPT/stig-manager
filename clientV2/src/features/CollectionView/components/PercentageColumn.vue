<script setup>
import Column from 'primevue/column'

defineProps({
  field: String,
  header: String
})

function renderPct (v) {
	const pct = v > 0 && v <= 0.5 ? 1 : v >= 99.5 && v < 100 ? 99 : Math.round(v)
	const symbol = v > 0 && v < 1 ? '<' : v > 99 && v < 100 ? '>' : ''
	const mercuryCls = pct >= 100 ? 'sm-cell-mercury-low' : pct >= 50 ? 'sm-cell-mercury-medium' : 'sm-cell-mercury-high'
	let markup = `
	<div class="sm-cell-thermometer-text">
		${symbol}${pct}%
	</div>
	<div class="sm-cell-thermometer-bg">
		<div class="${mercuryCls}" style="width: ${pct}%;">&nbsp;</div>
	</div>`
	return markup
}

</script>

<template>
  <Column :field="field" :header="header">
    <template #body="slotProps">
      <span v-html="renderPct(slotProps.data[slotProps.field])"></span>
    </template>
  </Column>
</template>

<style>
.sm-cell-thermometer-text {
  font-size: 12px;
  text-align: center;
  margin-bottom: 2px;
}
.sm-cell-thermometer-bg {
  background-color: #e0e0e0;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
}
.sm-cell-mercury-low {
  background-color: #4caf50;
  height: 100%;
}
.sm-cell-mercury-medium {
  background-color: #ff9800;
  height: 100%;
}
.sm-cell-mercury-high {
  background-color: #f44336;
  height: 100%;
}
</style>
