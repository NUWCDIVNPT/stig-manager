<script setup>
import Checkbox from 'primevue/checkbox'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import { computed } from 'vue'
import { FREQUENCY_OPTIONS, INTERVAL_FIELD_OPTIONS } from '../../lib/serviceJobsFormat.js'
import { selectPt } from '../../lib/serviceJobsPt.js'

// Schedule form model. Mirrors the legacy SchedulePanel fields; the parent owns
// serializing this into an `event` object.
const model = defineModel({ type: Object, required: true })

const isRecurring = computed(() => model.value.frequency === 'recurring')
const isOnce = computed(() => model.value.frequency === 'once')
const showStart = computed(() => isRecurring.value || isOnce.value)
</script>

<template>
  <div class="schedule-form">
    <div class="field-row">
      <div class="labeled-field">
        <label class="flabel">Frequency</label>
        <Select
          v-model="model.frequency"
          :options="FREQUENCY_OPTIONS"
          option-label="label"
          option-value="value"
          :pt="selectPt"
        />
      </div>

      <div v-if="isRecurring" class="labeled-field interval-field">
        <label class="flabel">Repeat every</label>
        <div class="interval-inputs">
          <InputNumber v-model="model.intervalValue" :min="1" :max="365" show-buttons />
          <Select
            v-model="model.intervalField"
            :options="INTERVAL_FIELD_OPTIONS"
            option-label="label"
            option-value="value"
            :pt="selectPt"
          />
        </div>
      </div>
    </div>

    <div v-if="showStart" class="field-row">
      <div class="labeled-field">
        <label class="flabel">Start date</label>
        <DatePicker v-model="model.startDate" date-format="D yy-mm-dd" />
      </div>
      <div class="labeled-field">
        <label class="flabel">Start time</label>
        <DatePicker v-model="model.startTime" time-only hour-format="24" />
      </div>
    </div>

    <div v-if="isRecurring" class="field-row">
      <label class="checkbox-field">
        <Checkbox v-model="model.enabled" binary />
        Enabled
      </label>
    </div>

    <p v-if="model.frequency === 'none'" class="hint">
      This job has no schedule and will only run when started manually.
    </p>
  </div>
</template>

<style scoped>
.schedule-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field-row {
  display: flex;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.labeled-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 12rem;
}

.interval-field {
  min-width: 18rem;
}

.interval-inputs {
  display: flex;
  gap: 0.5rem;
}

.flabel {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  color: var(--color-text-primary);
  cursor: pointer;
}

.hint {
  margin: 0;
  font-size: 0.95rem;
  color: var(--color-text-dim);
  font-style: italic;
}
</style>
