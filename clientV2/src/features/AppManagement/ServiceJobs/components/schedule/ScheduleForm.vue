<script setup>
import Checkbox from 'primevue/checkbox'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import { computed } from 'vue'
import { buildEventPayload, formatDateTime, FREQUENCY_OPTIONS, INTERVAL_FIELD_OPTIONS, scheduleSummary } from '../../lib/serviceJobsFormat.js'
import { datePickerPt, inputNumberPt, selectPt } from '../../lib/serviceJobsPt.js'

// Schedule form model. Mirrors the legacy SchedulePanel fields; the parent owns
// serializing this into an `event` object.
const model = defineModel({ type: Object, required: true })

const isRecurring = computed(() => model.value.frequency === 'recurring')
const isOnce = computed(() => model.value.frequency === 'once')
const showStart = computed(() => isRecurring.value || isOnce.value)

const FREQUENCY_ICONS = {
  none: 'pi pi-ban',
  recurring: 'pi pi-replay',
  once: 'pi pi-calendar',
}

// Human-readable restatement of the current selections, shown at the bottom so
// the operator can confirm the schedule at a glance.
const summaryText = computed(() => {
  const event = buildEventPayload(model.value)
  if (!event) {
    return model.value.frequency === 'none'
      ? 'This job runs only when started manually.'
      : 'Choose a valid start date and time to schedule this job.'
  }
  const when = formatDateTime(event.starts)
  if (event.type === 'once') {
    return `Runs once at ${when}.`
  }
  const base = `Runs ${scheduleSummary(event).toLowerCase()}, starting ${when}.`
  return model.value.enabled ? base : `${base} Automatic runs are paused.`
})
</script>

<template>
  <div class="schedule-form">
    <div class="field-block">
      <span class="block-label">Frequency</span>
      <div class="freq-options">
        <button
          v-for="opt in FREQUENCY_OPTIONS"
          :key="opt.value"
          type="button"
          class="freq-option"
          :class="{ 'freq-option--active': model.frequency === opt.value }"
          @click="model.frequency = opt.value"
        >
          <i :class="FREQUENCY_ICONS[opt.value]" />
          <span>{{ opt.label }}</span>
        </button>
      </div>
    </div>

    <div v-if="isRecurring" class="field-block">
      <span class="block-label">Repeat every</span>
      <div class="interval-inputs">
        <InputNumber v-model="model.intervalValue" :min="1" :max="365" :pt="inputNumberPt" />
        <Select
          v-model="model.intervalField"
          :options="INTERVAL_FIELD_OPTIONS"
          option-label="label"
          option-value="value"
          class="interval-unit"
          :pt="selectPt"
        />
      </div>
    </div>

    <div v-if="showStart" class="field-grid">
      <div class="labeled-field">
        <label class="flabel">Start date</label>
        <DatePicker v-model="model.startDate" date-format="D yy-mm-dd" show-icon icon-display="input" fluid :pt="datePickerPt" />
      </div>
      <div class="labeled-field">
        <label class="flabel">Start time</label>
        <DatePicker v-model="model.startTime" time-only hour-format="24" show-icon icon-display="input" fluid :pt="datePickerPt" />
      </div>
    </div>

    <label v-if="isRecurring" class="toggle-row">
      <Checkbox v-model="model.enabled" binary />
      <span class="toggle-text">
        <span class="toggle-title">Enabled</span>
        <span class="toggle-hint">Keep the schedule but pause automatic runs when unchecked.</span>
      </span>
    </label>

    <div class="schedule-summary" :class="{ 'schedule-summary--manual': model.frequency === 'none' }">
      <i class="pi pi-info-circle" />
      <span>{{ summaryText }}</span>
    </div>
  </div>
</template>

<style scoped>
.schedule-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-top: 0.25rem;
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.block-label,
.flabel {
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-text-dim);
}

.freq-options {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.freq-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1.1rem;
  min-width: 8rem;
  justify-content: center;
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 8px;
  color: var(--color-text-primary);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}

.freq-option:hover {
  border-color: color-mix(in srgb, var(--color-primary-highlight) 50%, var(--color-border-default));
}

.freq-option i {
  font-size: 1rem;
  color: var(--color-text-dim);
}

.freq-option--active {
  border-color: var(--color-primary-highlight);
  background: color-mix(in srgb, var(--color-primary-highlight) 14%, transparent);
  color: var(--color-text-bright);
}

.freq-option--active i {
  color: var(--color-primary-highlight);
}

.interval-inputs {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.interval-unit {
  max-width: 12rem;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem 1.25rem;
  max-width: 32rem;
}

.labeled-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

.toggle-row {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  cursor: pointer;
}

.toggle-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.toggle-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.toggle-hint {
  font-size: 1rem;
  color: var(--color-text-dim);
}

.schedule-summary {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: auto;
  padding: 0.75rem 1rem;
  background: color-mix(in srgb, var(--color-primary-highlight) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary-highlight) 25%, transparent);
  border-radius: 8px;
  font-size: 1rem;
  color: var(--color-text-primary);
}

.schedule-summary i {
  color: var(--color-primary-highlight);
  font-size: 1.1rem;
  flex-shrink: 0;
}

.schedule-summary--manual {
  background: var(--color-background-subtle);
  border-color: var(--color-border-default);
}

.schedule-summary--manual i {
  color: var(--color-text-dim);
}
</style>
