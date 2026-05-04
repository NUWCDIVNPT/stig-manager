<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
})

const KNOWN_CHIP_KINDS = new Set(['ruleId', 'check', 'fix', 'vulnDiscussion', 'severity'])

const chipClass = computed(() => {
  const kind = KNOWN_CHIP_KINDS.has(props.name) ? props.name.toLowerCase() : 'default'
  return `changed-property-chip--${kind}`
})
</script>

<template>
  <span
    class="changed-property-chip"
    :class="chipClass"
  >
    {{ name }}
  </span>
</template>

<style scoped>
.changed-property-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.05rem 0.6rem;
  border-radius: 3px;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid var(--color-chip-default-border);
  background-color: var(--color-chip-default-bg);
  color: var(--color-chip-default-text);
}

.changed-property-chip--ruleid {
  background-color: var(--color-chip-ruleid-bg);
  border-color: var(--color-chip-ruleid-border);
  color: var(--color-chip-ruleid-text);
}

.changed-property-chip--check {
  background-color: var(--color-chip-check-bg);
  border-color: var(--color-chip-check-border);
  color: var(--color-chip-check-text);
}

.changed-property-chip--fix {
  background-color: var(--color-chip-fix-bg);
  border-color: var(--color-chip-fix-border);
  color: var(--color-chip-fix-text);
}

.changed-property-chip--vulndiscussion {
  background-color: var(--color-chip-vulndiscussion-bg);
  border-color: var(--color-chip-vulndiscussion-border);
  color: var(--color-chip-vulndiscussion-text);
}

.changed-property-chip--severity {
  background-color: var(--color-chip-severity-bg);
  border-color: var(--color-chip-severity-border);
  color: var(--color-chip-severity-text);
}
</style>
