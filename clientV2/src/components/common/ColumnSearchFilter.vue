<script setup>
import InputText from 'primevue/inputtext'
import Popover from 'primevue/popover'
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    required: false,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Search...',
  },
})

const emit = defineEmits(['update:modelValue'])

const popover = ref(null)
const localValue = ref(props.modelValue)

watch(() => props.modelValue, (newVal) => {
  localValue.value = newVal
})

function toggle(event) {
  popover.value?.toggle(event)
}

function apply() {
  emit('update:modelValue', localValue.value)
  popover.value?.hide()
}

function clear() {
  localValue.value = ''
  emit('update:modelValue', '')
  popover.value?.hide()
}
</script>

<template>
  <div class="column-search-container">
    <button
      class="column-search-btn"
      :class="{ 'filter-active': modelValue && modelValue.length > 0 }"
      @click="toggle"
      @click.stop
    >
      <i class="pi pi-filter" />
    </button>
    <Popover ref="popover" :pt="{ root: { class: 'column-search-popover' } }">
      <div class="column-search-popover__inner">
        <InputText
          v-model="localValue"
          :placeholder="placeholder"
          class="column-search-popover__input"
          @keydown.enter="apply"
        />
        <div class="column-search-popover__actions">
          <button class="column-search-popover__btn column-search-popover__btn--clear" @click="clear">
            Clear
          </button>
          <button class="column-search-popover__btn column-search-popover__btn--apply" @click="apply">
            Apply
          </button>
        </div>
      </div>
    </Popover>
  </div>
</template>

<style scoped>
.column-search-container {
  display: inline-flex;
  align-items: center;
}

.column-search-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  width: 24px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  border-radius: 4px;
  color: var(--color-text-dim);
  transition: all 0.2s;
}

.column-search-btn:hover {
  background: color-mix(in srgb, var(--color-background-light) 40%, transparent);
}

.column-search-btn.filter-active,
.column-search-btn:hover .pi-filter {
  color: var(--color-primary);
  opacity: 1;
}

.pi-filter {
  font-size: var(--text-md);
  opacity: 0.8;
  margin-top: 3px;
  transition: opacity 0.2s, color 0.2s;
}
</style>

<style>
.column-search-popover {
  background-color: var(--color-background-dark) !important;
  border: 1px solid var(--color-border-default) !important;
  border-radius: 6px !important;
  padding: 0.75rem !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.6) !important;
}

.column-search-popover__inner {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 200px;
}

.column-search-popover__input {
  width: 100%;
  padding: 0.4rem 0.6rem !important;
  font-size: var(--text-md) !important;
  background: var(--color-background-light) !important;
  color: var(--color-text-primary) !important;
  border: 1px solid var(--color-border-default) !important;
  border-radius: 4px !important;
}

.column-search-popover__input:focus {
  outline: none !important;
  border-color: var(--color-primary) !important;
}

.column-search-popover__actions {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.column-search-popover__btn {
  flex: 1;
  padding: 0.3rem;
  font-size: var(--text-md);
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid transparent;
  background: var(--color-background-darkest);
  color: var(--color-text-primary);
  transition: background 0.1s;
}

.column-search-popover__btn:hover {
  background: var(--color-background-light);
}

.column-search-popover__btn--apply {
  background: var(--color-primary-highlight);
  color: white;
}

.column-search-popover__btn--apply:hover {
  background: color-mix(in srgb, var(--color-primary-highlight) 80%, black);
}
</style>
