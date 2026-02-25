<script setup>
import Column from 'primevue/column'

defineProps({
  field: String,
  header: String,
})

function renderPct(v) {
  const pct = v > 0 && v <= 0.5 ? 1 : v >= 99.5 && v < 100 ? 99 : Math.round(v)
  const symbol = v > 0 && v < 1 ? '<' : v > 99 && v < 100 ? '>' : ''
  const mercuryCls = pct >= 100 ? 'sm-cell-mercury-low' : pct >= 50 ? 'sm-cell-mercury-medium' : 'sm-cell-mercury-high'
  const markup = `
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
      <span v-html="renderPct(slotProps.data[slotProps.field])" />
    </template>
  </Column>
</template>

<style>
.sm-cell-thermometer-text {
  float: left;
  margin-left: 4px;
  font-style: italic;
  font-weight: 600
}
.sm-cell-thermometer-bg {
  background-color: var(--color-background-light);
  outline: solid 1px var(--color-border-default);
  border-radius: 3px;
  outline-offset: 0px

}
.sm-cell-mercury-low {
  background-color: #425722
}

.sm-cell-mercury-medium {
  background-color: hsl(209deg 48% 26%)
}

.sm-cell-mercury-high {
  background-color: hsl(5deg 56% 21%)
}
</style>
