<script setup>
import { computed } from 'vue'
import { escapeHtml } from '../../shared/lib/htmlUtils.js'
import { formatReviewDate } from '../../shared/lib/reviewFormUtils.js'
import { TOOLTIP_OPTS } from '../../shared/lib/tooltips.js'

const props = defineProps({
  resultEngine: {
    type: Object,
    default: null,
  },
})

const engineTooltipHtml = computed(() => {
  const re = props.resultEngine
  if (!re) {
    return ''
  }
  const lines = []
  if (re.version) {
    lines.push(`<b>Version</b><br>${escapeHtml(re.version)}`)
  }
  if (re.time) {
    lines.push(`<b>Time</b><br>${escapeHtml(formatReviewDate(re.time))}`)
  }
  if (re.checkContent?.location) {
    lines.push(`<b>Check content</b><br>${escapeHtml(re.checkContent.location)}`)
  }
  return lines.join('<br>')
})

const overrideTooltipHtml = computed(() => {
  const overrides = props.resultEngine?.overrides
  if (!overrides?.length) {
    return ''
  }
  return overrides.map((o) => {
    const lines = []
    if (o.authority) {
      lines.push(`<b>Authority</b><br>${escapeHtml(o.authority)}`)
    }
    if (o.remark) {
      lines.push(`<b>Remark</b><br>${escapeHtml(o.remark)}`)
    }
    lines.push(`<b>Old result</b>: ${escapeHtml(o.oldResult || '\u2014')} \u2192 <b>New result</b>: ${escapeHtml(o.newResult || '\u2014')}`)
    return lines.join('<br>')
  }).join('<hr style="margin: 0.3rem 0; opacity: 0.3">')
})
</script>

<template>
  <div class="result-engine-badges">
    <span
      v-if="resultEngine"
      v-tooltip="{ value: engineTooltipHtml, ...TOOLTIP_OPTS }"
      class="result-engine-badges__badge result-engine-badges__badge--engine"
    >
      {{ resultEngine.product || 'Engine' }}
    </span>
    <span v-else class="result-engine-badges__badge result-engine-badges__badge--manual">
      Manual
    </span>

    <span
      v-if="resultEngine?.overrides?.length"
      v-tooltip="{ value: overrideTooltipHtml, ...TOOLTIP_OPTS }"
      class="result-engine-badges__badge result-engine-badges__badge--override"
    >
      Override
    </span>
  </div>
</template>

<style scoped>
.result-engine-badges {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.result-engine-badges__badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 4px;
  cursor: default;
}

.result-engine-badges__badge--engine {
  color: var(--color-engine-text);
  background-color: var(--color-engine-bg);
  border: 1px solid var(--color-engine-border);
}

.result-engine-badges__badge--manual {
  color: var(--color-text-primary);
  background-color: var(--color-background-dark);
  border: 1px solid var(--color-border-light);
  opacity: 0.7;
}

.result-engine-badges__badge--override {
  color: var(--color-override-text);
  background-color: var(--color-override-bg);
  border: 1px solid var(--color-override-border);
}
</style>
