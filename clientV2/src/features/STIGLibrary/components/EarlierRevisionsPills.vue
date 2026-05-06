<script setup>
import { computed } from 'vue'

const props = defineProps({
  revisions: {
    type: Array,
    default: () => [],
  },
  max: {
    type: Number,
    default: 3,
  },
})

const earlier = computed(() => (props.revisions ?? []).slice(1))
const shown = computed(() => earlier.value.slice(0, props.max))
const overflow = computed(() => Math.max(0, earlier.value.length - shown.value.length))
const overflowTitle = computed(() => earlier.value.slice(props.max).join(', '))
</script>

<template>
  <div v-if="earlier.length" class="earlier-revisions">
    <span
      v-for="r in shown"
      :key="r"
      class="earlier-revisions__pill"
    >{{ r }}</span>
    <span
      v-if="overflow > 0"
      class="earlier-revisions__pill earlier-revisions__pill--more"
      :title="overflowTitle"
    >+{{ overflow }}</span>
  </div>
  <span v-else class="earlier-revisions__none">—</span>
</template>

<style scoped>
.earlier-revisions {
  display: inline-flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.earlier-revisions__pill {
  padding: 0.05rem 0.5rem;
  border-radius: 3px;
  background-color: var(--color-background-darkest);
  border: 1px solid var(--color-border-default);
  color: var(--color-text-dim);
  font-family: monospace;
  font-size: 1.1rem;
  line-height: 1.4;
}

.earlier-revisions__pill--more {
  background-color: transparent;
  font-weight: 600;
  cursor: help;
}

.earlier-revisions__none {
  color: var(--color-text-dim);
}
</style>
