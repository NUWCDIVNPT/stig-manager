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

    <div v-else-if="!selectedChecklistItem" class="rule-info__empty">
      Select a rule from the checklist to view its content.
    </div>

    <div v-else-if="ruleContent" class="rule-info__content">
      <!-- Header -->
      <div class="rule-info__header">
        <div class="rule-info__header-row">
          <span class="rule-info__rule-id">{{ ruleContent.ruleId }}</span>
          <div v-if="ruleContent.severity" class="rule-info__cat-badge">
            <CatBadge :category="severityMap[ruleContent.severity] || 2" />
          </div>
        </div>
        <div v-if="ruleContent.version" class="rule-info__version">
          {{ ruleContent.version }}
        </div>
        <div class="rule-info__title">
          {{ ruleContent.title }}
        </div>
      </div>

      <!-- Check Content -->
      <section v-if="ruleContent.check?.content" class="rule-info__section">
        <h4 class="rule-info__section-title">
          Manual Check
        </h4>
        <div class="rule-info__text">
          {{ ruleContent.check.content }}
        </div>
      </section>

      <!-- Fix Text -->
      <section v-if="ruleContent.fix?.text" class="rule-info__section">
        <h4 class="rule-info__section-title">
          Fix
        </h4>
        <div class="rule-info__text">
          {{ ruleContent.fix.text }}
        </div>
      </section>

      <!-- Other Data -->
      <section class="rule-info__section">
        <h4 class="rule-info__section-title">
          Other Data
        </h4>

        <div v-if="ruleContent.detail?.vulnDiscussion" class="rule-info__field">
          <span class="rule-info__field-label">Vulnerability Discussion</span>
          <div class="rule-info__text">
            {{ ruleContent.detail.vulnDiscussion }}
          </div>
        </div>

        <div v-if="ruleContent.detail?.documentable !== undefined" class="rule-info__field rule-info__field--inline">
          <span class="rule-info__field-label">Documentable:</span>
          <span>{{ ruleContent.detail.documentable ? 'true' : 'false' }}</span>
        </div>

        <div v-if="ruleContent.detail?.responsibility" class="rule-info__field rule-info__field--inline">
          <span class="rule-info__field-label">Responsibility:</span>
          <span>{{ ruleContent.detail.responsibility }}</span>
        </div>

        <!-- Controls Table (CCIs) -->
        <div v-if="ruleContent.ccis?.length" class="rule-info__field">
          <span class="rule-info__field-label">Controls:</span>
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

.rule-info__panel-header {
  display: flex;
  align-items: center;
  padding: 0.35rem 0.5rem;
  background-color: var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.rule-info__panel-title {
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-text-primary);
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
}

.rule-info__header {
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border-light);
}

.rule-info__header-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.rule-info__rule-id {
  font-size: 2.2rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.rule-info__cat-badge {
  margin-left: auto;
}

.rule-info__version {
  color: var(--color-text-dim);
  margin-bottom: 0.35rem;
}

.rule-info__title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.4;
}

.rule-info__section {
  margin-bottom: 1rem;
}

.rule-info__section-title {
  margin: 0 0 0.4rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-primary-highlight);
}

.rule-info__text {
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
}

.rule-info__field {
  margin-bottom: 0.6rem;
}

.rule-info__field--inline {
  display: flex;
  gap: 0.35rem;
  align-items: baseline;
}

.rule-info__field-label {
  font-weight: 600;
  color: var(--color-text-dim);
}

.rule-info__field:not(.rule-info__field--inline) .rule-info__field-label {
  display: block;
  margin-bottom: 0.2rem;
}

.controls-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.25rem;
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
