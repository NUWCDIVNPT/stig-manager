<script setup>
import { computed } from 'vue'
import AppInfoToolbar from './AppInfoToolbar.vue'

const props = defineProps({
  report: { type: Object, default: null },
  source: { type: String, default: '' },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['load-file', 'save-full', 'save-shareable', 'fetch-quick', 'fetch-full'])

// Reports are normalized to the v1.1 schema before reaching this component
const reportDate = computed(() => props.report?.date ?? '—')
const reportVersion = computed(() => props.report?.version ?? '—')
</script>

<template>
  <div class="source-panel">
    <div class="source-panel-header">
      Source
    </div>

    <AppInfoToolbar
      :has-report="!!report"
      :loading="loading"
      @load-file="emit('load-file', $event)"
      @save-full="emit('save-full')"
      @save-shareable="emit('save-shareable', $event)"
      @fetch-quick="emit('fetch-quick')"
      @fetch-full="emit('fetch-full')"
    />

    <div class="source-body">
      <dl class="source-meta">
        <dt>Source:</dt>
        <dd>{{ source || '—' }}</dd>
        <dt>Date:</dt>
        <dd>{{ reportDate }}</dd>
        <dt>Version:</dt>
        <dd>{{ reportVersion }}</dd>
      </dl>

      <div class="share-callout">
        <div class="share-callout-title">
          Help the STIG Manager OSS project by sharing
        </div>
        <p>
          The <i class="pi pi-share-alt" /> <b>Save for sharing</b> option can create a file without
          identifiers or environment information. Mail to
          <a href="mailto:RMF_Tools@us.navy.mil">RMF_Tools@us.navy.mil</a>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.source-panel {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  padding: 0.75rem 1rem 1rem;
  overflow: hidden;
}

.source-panel-header {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-text-bright);
}

.source-body {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
  flex-wrap: nowrap;
  overflow: hidden;
}

.source-meta {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 2rem;
  row-gap: 0.5rem;
  margin: 0;
  min-width: 18rem;
  flex: 0 0 auto;
  flex-shrink: 0;
}

.source-meta dt {
  color: var(--color-text-dim);
  font-size: 1.1rem;
}

.source-meta dd {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1.1rem;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}

.share-callout {
  flex: 0 1 30rem;
  min-width: 20rem;
  max-width: 32rem;
  flex-shrink: 0;
  background: var(--color-background-subtle);
  border: 1px solid var(--color-border-default);
  border-radius: 8px;
  padding: 0.55rem 0.9rem;
  overflow: hidden;
}

.share-callout-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text-bright);
  text-align: center;
  margin-bottom: 0.3rem;
}

.share-callout p {
  margin: 0;
  color: var(--color-text-dim);
  font-size: 0.9rem;
  line-height: 1.35;
}

.share-callout a {
  color: var(--color-primary-highlight);
}
</style>
