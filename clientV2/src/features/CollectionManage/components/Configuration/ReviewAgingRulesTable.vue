<script setup>
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import collectionIcon from '../../../../assets/collection.svg'
import shieldGreenCheckIcon from '../../../../assets/shield-green-check.svg'
import targetIcon from '../../../../assets/target.svg'
import LabelChip from '../../../../components/common/Label.vue'
import StatusFooter from '../../../../components/common/StatusFooter.vue'
import { normalizeColor } from '../../../../shared/lib/colorUtils.js'
import {
  ruleSummary,
  ruleTargetLines,
  ruleTitle,
} from './reviewAgingLogic.js'

defineProps({
  rules: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  // Owners may add/edit/reorder/delete rules; others get a read-only grid.
  canEdit: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['new', 'edit', 'move', 'delete'])

const iconMap = {
  collection: collectionIcon,
  asset: targetIcon,
  stig: shieldGreenCheckIcon,
}

const tablePt = {
  root: { style: 'background-color: var(--color-background-dark); flex: 1 1 auto; display: flex; flex-direction: column;' },
  wrapper: { style: 'background-color: var(--color-background-dark); flex: 1 1 auto; display: flex; flex-direction: column;' },
  tbody: { style: 'background-color: var(--color-background-dark);' },
  footer: { style: 'padding: 0; border: none;' },
}

const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }
</script>

<template>
  <div class="rules-panel">
    <Toolbar v-if="canEdit" class="rules-toolbar">
      <template #start>
        <button class="action-btn" @click="emit('new')">
          <i class="pi pi-plus-circle icon-green" /> New Rule
        </button>
      </template>
    </Toolbar>

    <DataTable
      :value="rules"
      data-key="_clientId"
      :loading="loading"
      scrollable
      scroll-height="flex"
      class="rules-table"
      :pt="tablePt"
      @row-dblclick="emit('edit', $event.data)"
    >
      <Column header="Rule" :pt="borderPt">
        <template #body="{ data }">
          <div class="rule-cell">
            <div class="rule-title-line">
              <Tag
                :value="data.enabled ? 'Enabled' : 'Disabled'"
                :severity="data.enabled ? 'success' : 'secondary'"
                rounded
              />
              <span class="rule-title">{{ ruleTitle(data) }}</span>
            </div>

            <div class="rule-targets">
              <span v-for="(line, i) in ruleTargetLines(data)" :key="i" class="rule-target">
                <LabelChip
                  v-if="line.type === 'label'"
                  :value="line.label.name"
                  :color="normalizeColor(line.label.color, '#cccccc')"
                />
                <template v-else>
                  <img
                    v-if="iconMap[line.type]"
                    :src="iconMap[line.type]"
                    class="rule-target-svg"
                    alt=""
                  >
                  <i v-else class="pi rule-target-icon" :class="line.icon" />
                  <span>{{ line.text }}</span>
                </template>
              </span>
            </div>

            <div class="rule-summary">
              {{ ruleSummary(data) }}
            </div>
          </div>
        </template>
      </Column>
      <Column v-if="canEdit" header="" style="width: 9rem;">
        <template #body="{ data, index }">
          <div class="rule-actions">
            <Button
              icon="pi pi-arrow-up"
              severity="secondary"
              text
              rounded
              size="small"
              title="Move up"
              :disabled="index === 0"
              @click="emit('move', data, -1)"
            />
            <Button
              icon="pi pi-arrow-down"
              severity="secondary"
              text
              rounded
              size="small"
              title="Move down"
              :disabled="index === rules.length - 1"
              @click="emit('move', data, 1)"
            />
            <Button
              icon="pi pi-pencil"
              severity="secondary"
              text
              rounded
              size="small"
              title="Edit rule"
              @click="emit('edit', data)"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              size="small"
              title="Delete rule"
              @click="emit('delete', data)"
            />
          </div>
        </template>
      </Column>

      <template #empty>
        No rules configured. Click "New Rule" to add one.
      </template>

      <template #footer>
        <StatusFooter
          :show-refresh="false"
          :show-export="false"
          :total-count="rules.length"
          total-label="rules"
          total-icon="pi pi-cog"
        />
      </template>
    </DataTable>
  </div>
</template>

<style scoped>
.rules-panel {
  display: flex;
  flex-direction: column;
  height: 32rem;
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  background: var(--color-background-dark);
  overflow: hidden;
}

.rules-toolbar {
  padding: 0.25rem 0.5rem;
  border: none;
  border-bottom: 1px solid var(--color-border-default);
  border-radius: 0;
  background: var(--color-background-light);
  flex-shrink: 0;
}

.rules-table {
  flex: 1 1 auto;
  min-height: 0;
}

/* New Rule button — matches AssetsToolbar / LabelsToolbar */
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: var(--color-text-default);
  font-size: 0.98rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.45rem 0.7rem;
  border-radius: 4px;
  transition: background-color 0.1s, color 0.1s;
}

.action-btn:hover:not(:disabled) {
  background: var(--color-bg-hover-strong);
  color: var(--color-text-bright);
}

.action-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.action-btn i.icon-green {
  color: var(--color-action-green);
}

.rule-cell {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.35rem 0;
}

.rule-title-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rule-title {
  font-weight: 600;
  color: var(--color-text-bright);
}

.rule-targets {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.85rem;
  padding-left: 1.2rem;
}

.rule-target {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-text-primary);
}

.rule-target-icon {
  font-size: 0.8rem;
  color: var(--color-text-dim);
}

.rule-target-svg {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  display: inline-block;
  vertical-align: middle;
}

.rule-summary {
  padding-left: 1.2rem;
  color: var(--color-text-dim);
  font-size: 1rem;
}

.rule-actions {
  display: flex;
  gap: 0.1rem;
}
</style>
