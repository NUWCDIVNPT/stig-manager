<script setup>
import CatBadge from '../../../components/common/CatBadge.vue'
import { severityMap } from '../lib/checklistUtils.js'

defineProps({
  ruleContent: {
    type: Object,
    default: null,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  ruleContentError: {
    type: Object,
    default: null,
  },
  selectedChecklistItem: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['retry'])
</script>

<template>
  <div class="rule-info">
    <div class="rule-info__panel-header">
      <span v-if="selectedChecklistItem" class="rule-info__panel-title">
        Rule for Group {{ selectedChecklistItem.groupId }}
      </span>
      <span v-else class="rule-info__panel-title">
        Rule Content
      </span>
    </div>

    <div v-if="isLoading" class="rule-info__loading">
      <i class="pi pi-spinner pi-spin" />
      Loading rule content...
    </div>

    <div v-else-if="ruleContentError" class="rule-info__fetch-error">
      <i class="pi pi-exclamation-triangle" />
      <span>Could not load rule content.</span>
      <button class="rule-info__retry-btn" @click="emit('retry')">
        Retry
      </button>
    </div>

    <div v-else-if="!selectedChecklistItem" class="rule-info__empty">
      Select a rule from the checklist to view its content.
    </div>

    <div v-else-if="ruleContent" class="rule-info__content">
      <!-- Header -->
      <div class="rule-info__header">
        <div class="rule-info__header-row">
          <span class="rule-info__rule-id">{{ ruleContent.ruleId }}</span>
          <div class="rule-info__cat-badge">
            <CatBadge :category="severityMap[ruleContent.severity]" variant="label" />
          </div>
        </div>
        <div v-if="ruleContent.version" class="rule-info__version">
          {{ ruleContent.version }}
        </div>
        <div class="rule-info__title">
          {{ ruleContent.title }}
        </div>
      </div>

      <!-- Check Content + Fix (one card) -->
      <div v-if="ruleContent.check?.content || ruleContent.fix?.text" class="rule-info__card">
        <div v-if="ruleContent.check?.content" class="rule-info__card-section">
          <h4 class="rule-info__section-title">
            Manual Check
          </h4>
          <pre class="rule-info__pre">{{ ruleContent.check.content }}</pre>
        </div>

        <div v-if="ruleContent.fix?.text" class="rule-info__card-section">
          <h4 class="rule-info__section-title">
            Fix
          </h4>
          <pre class="rule-info__pre">{{ ruleContent.fix.text }}</pre>
        </div>
      </div>

      <!-- Other Data (separate card) -->
      <div class="rule-info__card">
        <h4 class="rule-info__section-title">
          Other Data
        </h4>

        <div v-if="ruleContent.detail?.vulnDiscussion" class="rule-info__card-section">
          <span class="rule-info__sub-label">Vulnerability Discussion</span>
          <pre class="rule-info__pre">{{ ruleContent.detail.vulnDiscussion }}</pre>
        </div>

        <div v-if="ruleContent.detail?.documentable !== undefined" class="rule-info__field-inline">
          <span class="rule-info__sub-label">Documentable:</span>
          <span>{{ ruleContent.detail.documentable ? 'true' : 'false' }}</span>
        </div>

        <div v-if="ruleContent.detail?.responsibility" class="rule-info__field-inline">
          <span class="rule-info__sub-label">Responsibility:</span>
          <span>{{ ruleContent.detail.responsibility }}</span>
        </div>

        <!-- Controls Table (CCIs) -->
        <div v-if="ruleContent.ccis?.length" class="rule-info__card-section">
          <span class="rule-info__sub-label">Controls:</span>
          <table class="controls-table">
            <thead>
              <tr>
                <th>CCI</th>
                <th>AP Acronym</th>
                <th>Control</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cci in ruleContent.ccis" :key="cci.cci">
                <td>{{ cci.cci }}</td>
                <td>{{ cci.apAcronym || '-' }}</td>
                <td>{{ cci.control || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rule-info {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-subtle);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  overflow: hidden;
}

.rule-info__panel-header {
  display: flex;
  align-items: center;
  padding: 0.7rem 0.9rem;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-background-light) 38%, transparent), transparent 75%),
    var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-default);
  flex-shrink: 0;
  height: 7.2rem;
}

.rule-info__panel-title {
  font-weight: 600;
  font-size: 1.15rem;
  color: var(--color-text-primary);
}

.rule-info__content {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-default) transparent;
}

.rule-info__content::-webkit-scrollbar {
  width: 6px;
}

.rule-info__content::-webkit-scrollbar-track {
  background: transparent;
}

.rule-info__content::-webkit-scrollbar-button {
  display: none;
  width: 0;
  height: 0;
}

.rule-info__content::-webkit-scrollbar-thumb {
  background-color: var(--color-border-default);
  border-radius: 999px;
  border: none;
  min-height: 28px;
}

.rule-info__content::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-border-hover);
}

.rule-info__loading,
.rule-info__empty,
.rule-info__fetch-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 100%;
  color: var(--color-text-dim);
}

.rule-info__fetch-error {
  color: var(--color-text-error, #e74c3c);
  flex-direction: column;
  gap: 0.75rem;
}

.rule-info__fetch-error .pi {
  font-size: 1.5rem;
  opacity: 0.8;
}

.rule-info__retry-btn {
  background: none;
  border: 1px solid var(--color-text-error, #e74c3c);
  color: var(--color-text-error, #e74c3c);
  border-radius: 4px;
  padding: 0.2rem 0.8rem;
  cursor: pointer;
  font-size: 1rem;
  opacity: 0.85;
  transition: opacity 0.15s;
}

.rule-info__retry-btn:hover {
  opacity: 1;
}

.rule-info__header {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border-light);
}

.rule-info__header-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.rule-info__rule-id {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.rule-info__cat-badge {
  margin-left: auto;
}

.rule-info__version {
  color: var(--color-text-dim);
  margin-bottom: 1rem;
}

.rule-info__title {
  font-size: 1.45rem;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.4;
  padding-left: 0.5rem;
}

.rule-info__card {
  background-color: var(--color-background-dark);
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1rem;
}

.rule-info__card-section {
  margin-bottom: 1.5rem;
}

.rule-info__card-section:last-child {
  margin-bottom: 0;
}

.rule-info__section-title {
  margin: 0 0 0.35rem 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-action-blue);
}

.rule-info__sub-label {
  font-weight: 600;
  color: var(--color-text-primary);
  display: block;
  margin-bottom: 0.5rem;
  padding-left: 0.5rem;
}

.rule-info__pre {
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.4;
  font-family: inherit;
  font-size: 1.08rem;
  margin: 0;
  padding: 0 1.25rem;
}

.rule-info__field-inline {
  display: flex;
  gap: 0.35rem;
  align-items: baseline;
  margin-bottom: 0.3rem;
  padding: 0;
}

.controls-table {
  width: calc(100% - 1.25rem);
  border-collapse: collapse;
  margin-top: 0.25rem;
  margin-left: 1.25rem;
}

.controls-table th,
.controls-table td {
  padding: 0.3rem 0.5rem;
  text-align: left;
  border: 1px solid var(--color-border-light);
}

.controls-table th {
  background-color: var(--color-background-dark);
  font-weight: 600;
  color: var(--color-text-dim);
}

.controls-table td {
  color: var(--color-text-primary);
}

.controls-table tr:nth-child(even) td {
  background-color: var(--color-background-dark);
}
</style>
