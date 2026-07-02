<script setup>
import { computed } from 'vue'
import { TOOLTIP_OPTS } from '../../shared/lib/tooltips.js'

// Standard help affordance: a small icon with a PrimeVue hover tooltip.
// The `tooltip` directive is registered globally in main.js.
const props = defineProps({
  // Tooltip text/HTML (rendered with escape:false — use TOOLTIPS.* values).
  content: { type: String, required: true },
  // Icon class; defaults to the question-circle help glyph.
  icon: { type: String, default: 'pi pi-question-circle' },
  // Optional class applied to the tooltip popup, for styling rich HTML content
  // (e.g. "sm-cora-tip"). Needed because tooltip content renders outside the
  // component, so scoped styles can't reach it.
  tipClass: { type: String, default: '' },
})

const binding = computed(() => ({
  ...TOOLTIP_OPTS,
  value: props.content,
  pt: { root: { ...TOOLTIP_OPTS.pt.root, class: props.tipClass } },
}))
</script>

<template>
  <i v-tooltip="binding" :class="icon" class="sm-help-icon" />
</template>

<style scoped>
.sm-help-icon {
  font-size: 1.2rem;
  color: var(--color-text-dim);
  margin-left: 0.4rem;
  cursor: pointer;
}

.sm-help-icon:hover {
  color: var(--color-text-primary);
}
</style>
