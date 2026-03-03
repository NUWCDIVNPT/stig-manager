<script setup>
import CatBadge from '../../../components/common/CatBadge.vue'

defineProps({
  ruleContent: {
    type: Object,
    default: null,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  selectedChecklistItem: {
    type: Object,
    default: null,
  },
})

const severityMap = { high: 1, medium: 2, low: 3 }
</script>

<template>
  <div class="rule-info">
    <div v-if="isLoading" class="rule-info__loading">
      <i class="pi pi-spinner pi-spin" />
      Loading rule content...
    </div>

    <div v-else-if="!selectedChecklistItem" class="rule-info__empty">
      Select a rule from the checklist to view its content.
    </div>

    <div v-else-if="ruleContent" class="rule-info__content">
      <!-- Header -->
      <div class="rule-info__header">
        <div class="rule-info__header-row">
          <span class="rule-info__rule-id">{{ ruleContent.ruleId }}</span>
          <CatBadge
            v-if="ruleContent.severity"
            :category="severityMap[ruleContent.severity] || 2"
          />
          <span v-if="ruleContent.version" class="rule-info__version">{{ ruleContent.version }}</span>
        </div>
        <h3 class="rule-info__title">
          {{ ruleContent.title }}
        </h3>
      </div>

      <!-- Check Content -->
      <section v-if="ruleContent.check?.content" class="rule-info__section">
        <h4 class="rule-info__section-title">
          Manual Check
        </h4>
        <pre class="rule-info__pre">{{ ruleContent.check.content }}</pre>
      </section>

      <!-- Fix Text -->
      <section v-if="ruleContent.fix?.text" class="rule-info__section">
        <h4 class="rule-info__section-title">
          Fix
        </h4>
        <pre class="rule-info__pre">{{ ruleContent.fix.text }}</pre>
      </section>

      <!-- Other Data -->
      <section class="rule-info__section">
        <h4 class="rule-info__section-title">
          Other Data
        </h4>

        <div v-if="ruleContent.detail?.vulnDiscussion" class="rule-info__field">
          <span class="rule-info__field-label">Vulnerability Discussion</span>
          <pre class="rule-info__pre">{{ ruleContent.detail.vulnDiscussion }}</pre>
        </div>

        <div v-if="ruleContent.detail?.documentable !== undefined" class="rule-info__field">
          <span class="rule-info__field-label">Documentable</span>
          <span class="rule-info__field-value">{{ ruleContent.detail.documentable ? 'Yes' : 'No' }}</span>
        </div>

        <div v-if="ruleContent.detail?.responsibility" class="rule-info__field">
          <span class="rule-info__field-label">Responsibility</span>
          <span class="rule-info__field-value">{{ ruleContent.detail.responsibility }}</span>
        </div>

        <!-- Controls Table (CCIs) -->
        <div class="rule-info__field">
          <span class="rule-info__field-label">Controls</span>
          <div v-if="ruleContent.ccis?.length" class="rule-info__controls">
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
          <span v-else class="rule-info__field-value">No mapped controls</span>
        </div>
      </section>
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

.rule-info__content {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
}

.rule-info__loading,
.rule-info__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 100%;
  color: var(--color-text-dim);
  font-size: 0.85rem;
}

.rule-info__header {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border-light);
}

.rule-info__header-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.rule-info__rule-id {
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--color-text-dim);
}

.rule-info__version {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  background-color: var(--color-background-dark);
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
}

.rule-info__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.4;
}

.rule-info__section {
  margin-bottom: 1rem;
}

.rule-info__section-title {
  margin: 0 0 0.4rem 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-secondary, var(--color-text-primary));
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.rule-info__pre {
  margin: 0;
  padding: 0.5rem;
  background-color: var(--color-background-dark);
  border: 1px solid var(--color-border-light);
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
}

.rule-info__field {
  margin-bottom: 0.6rem;
}

.rule-info__field-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-dim);
  margin-bottom: 0.2rem;
}

.rule-info__field-value {
  font-size: 0.8rem;
  color: var(--color-text-primary);
}

.controls-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
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
  font-size: 0.75rem;
  text-transform: uppercase;
}

.controls-table td {
  color: var(--color-text-primary);
}

.controls-table tr:nth-child(even) td {
  background-color: var(--color-background-dark);
}
</style>
