<script setup>
import { computed } from 'vue'

const props = defineProps({
  level: {
    type: String,
    required: true,
    validator: value => ['U', 'CUI', 'FOUO', 'C', 'S', 'TS', 'SCI'].includes(value),
  },
})

const LEVEL_TO_CLASS = {
  U: 'classification-badge--u',
  CUI: 'classification-badge--cui',
  FOUO: 'classification-badge--fouo',
  C: 'classification-badge--c',
  S: 'classification-badge--s',
  TS: 'classification-badge--ts',
  SCI: 'classification-badge--sci',
}

const badgeClass = computed(() => LEVEL_TO_CLASS[props.level])
</script>

<template>
  <span
    class="classification-badge"
    :class="badgeClass"
    :title="`Classification: ${level}`"
  >
    {{ level }}
  </span>
</template>

<style scoped>
.classification-badge {
  display: inline-flex;
  align-items: center;
  padding: 0 0.45rem;
  border-radius: 3px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  line-height: 1.5;
  color: #fff;
}

.classification-badge--u {
  background-color: var(--color-marking-unclassified);
}

.classification-badge--cui {
  background-color: var(--color-marking-cui);
}

.classification-badge--fouo {
  background-color: var(--color-marking-fouo);
}

.classification-badge--c {
  background-color: var(--color-marking-confidential);
}

.classification-badge--s {
  background-color: var(--color-marking-secret);
}

.classification-badge--ts {
  background-color: var(--color-marking-topsecret);
}

.classification-badge--sci {
  background-color: var(--color-marking-sci);
  color: var(--color-text-dark);
}
</style>
