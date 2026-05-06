<script setup>
import { computed } from 'vue'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  side: {
    type: String,
    required: true,
    validator: value => ['del', 'add'].includes(value),
  },
})

const RULE_ID_REGEX = /^(SV-[^r]+r)(\d+)(_rule)?$/

const parts = computed(() => {
  const match = props.id.match(RULE_ID_REGEX)
  if (!match) {
    return null
  }
  return { prefix: match[1], hash: match[2], suffix: match[3] || '' }
})

const highlightClass = computed(() => `rule-id-diff__hash--${props.side}`)
</script>

<template>
  <span class="rule-id-diff">
    <template v-if="parts">
      <span>{{ parts.prefix }}</span>
      <span :class="highlightClass">{{ parts.hash }}</span>
      <span>{{ parts.suffix }}</span>
    </template>
    <template v-else>{{ id }}</template>
  </span>
</template>

<style scoped>
.rule-id-diff {
  font-family: monospace;
  word-break: break-all;
}

.rule-id-diff__hash--del {
  background-color: var(--color-diff-inline-del-bg);
  color: var(--color-diff-inline-del-text);
  text-decoration: line-through;
  padding: 0 0.18rem;
  border-radius: 2px;
}

.rule-id-diff__hash--add {
  background-color: var(--color-diff-inline-add-bg);
  color: var(--color-diff-inline-add-text);
  padding: 0 0.18rem;
  border-radius: 2px;
}
</style>
