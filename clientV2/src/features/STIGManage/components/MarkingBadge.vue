<script setup>
const MARKINGS = {
  U: { label: 'U', title: 'Unclassified', bg: 'var(--color-marking-unclassified)' },
  CUI: { label: 'CUI', title: 'Controlled Unclassified Information', bg: 'var(--color-marking-cui)' },
  // FOUO intentionally uses green (same as Unclassified) in this table, not the global FOUO purple.
  FOUO: { label: 'FOUO', title: 'For Official Use Only', bg: 'var(--color-marking-unclassified)' },
}

const props = defineProps({
  marking: {
    type: String,
    default: null,
  },
})

const config = MARKINGS[props.marking] ?? null
</script>

<template>
  <span
    v-if="config"
    class="marking-badge"
    :style="{ backgroundColor: config.bg }"
    :title="config.title"
  >{{ config.label }}</span>
</template>

<style scoped>
.marking-badge {
  display: inline-block;
  padding: 1px 4px;
  border-radius: 3px;
  color: #fff;
  font-weight: 800;
  font-size: 0.8rem;
  line-height: 1.35;
  letter-spacing: 0.04em;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
