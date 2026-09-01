<script setup>
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import { computed, ref } from 'vue'
import { primaryBtnPt } from '../../../../shared/lib/dialogPt.js'

const props = defineProps({
  // The filter currently applied to the stream (store state.filter, null = no
  // constraint). The Popover unmounts this menu on every hide, so the checkbox
  // state must be re-seeded from the durable filter on each open.
  activeFilter: { type: Object, default: null },
})

const emit = defineEmits(['apply'])

// Level/component filter matching the old client. A category is only sent when
// it is partially selected — all-checked means "no constraint", so it is
// omitted, and if neither category constrains anything the filter is null.
const LEVELS = [
  { value: 3, label: 'Info' },
  { value: 2, label: 'Warning' },
  { value: 1, label: 'Error' },
]
const COMPONENTS = ['jwksCache', 'mysql', 'logSocket', 'rest', 'static']

const selectedLevels = ref([...(props.activeFilter?.level ?? LEVELS.map(l => l.value))])
const selectedComponents = ref([...(props.activeFilter?.component ?? COMPONENTS)])

function buildFilter() {
  const filter = {}
  if (selectedLevels.value.length && selectedLevels.value.length < LEVELS.length) {
    filter.level = [...selectedLevels.value]
  }
  if (selectedComponents.value.length && selectedComponents.value.length < COMPONENTS.length) {
    filter.component = [...selectedComponents.value]
  }
  return filter.level || filter.component ? filter : null
}

const anySelected = computed(() => selectedLevels.value.length > 0 && selectedComponents.value.length > 0)
</script>

<template>
  <div class="log-filter">
    <fieldset class="log-filter-set">
      <legend>Level</legend>
      <label v-for="level in LEVELS" :key="level.value" class="log-filter-option">
        <Checkbox v-model="selectedLevels" :value="level.value" :input-id="`level-${level.value}`" />
        <span>{{ level.label }}</span>
      </label>
    </fieldset>

    <fieldset class="log-filter-set">
      <legend>Component</legend>
      <label v-for="comp in COMPONENTS" :key="comp" class="log-filter-option">
        <Checkbox v-model="selectedComponents" :value="comp" :input-id="`comp-${comp}`" />
        <span>{{ comp }}</span>
      </label>
    </fieldset>

    <Button
      label="Stream"
      icon="pi pi-play"
      severity="primary"
      :pt="primaryBtnPt"
      :disabled="!anySelected"
      @click="emit('apply', buildFilter())"
    />
  </div>
</template>

<style scoped>
.log-filter {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem;
  min-width: 180px;
}

.log-filter-set {
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  padding: 0.5rem 0.75rem 0.75rem;
  margin: 0;
}

.log-filter-set legend {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-text-dim);
  padding: 0 0.35rem;
}

.log-filter-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  font-size: 1.1rem;
  color: var(--color-text-primary);
  cursor: pointer;
}
</style>
