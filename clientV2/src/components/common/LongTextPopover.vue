<script setup>
import Popover from 'primevue/popover'
import { ref } from 'vue'

const popover = ref(null)
const data = ref({ label: '', text: '' })
const copyState = ref('idle') // 'idle' | 'copied'

const show = (event, label, text) => {
  data.value = { label, text }
  copyState.value = 'idle'
  popover.value?.show(event)
}

const hide = () => {
  popover.value?.hide()
}

const copy = async () => {
  try {
    await navigator.clipboard.writeText(data.value.text ?? '')
    copyState.value = 'copied'
    setTimeout(() => { copyState.value = 'idle' }, 1500)
  }
  catch {
    copyState.value = 'idle'
  }
}

defineExpose({ show, hide })
</script>

<template>
  <Popover ref="popover" :pt="{ root: { class: 'long-text-popover' } }">
    <div class="long-text-popover__inner">
      <div class="long-text-popover__header">
        <span class="long-text-popover__label">{{ data.label }}</span>
        <button
          type="button"
          class="long-text-popover__copy-btn"
          :class="{ 'long-text-popover__copy-btn--copied': copyState === 'copied' }"
          @click="copy"
        >
          <i :class="copyState === 'copied' ? 'pi pi-check' : 'pi pi-copy'" />
          {{ copyState === 'copied' ? 'Copied' : 'Copy' }}
        </button>
      </div>
      <div class="long-text-popover__body">
        {{ data.text }}
      </div>
    </div>
  </Popover>
</template>

<style>
/* Unscoped: PrimeVue Popover renders outside this component's scope. */
.long-text-popover {
  background-color: var(--color-background-light) !important;
  border: 1px solid var(--color-primary-highlight) !important;
  border-radius: 8px !important;
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.65),
    0 0 0 1px rgba(255, 255, 255, 0.05),
    0 0 24px color-mix(in srgb, var(--color-primary-highlight) 25%, transparent) !important;
  overflow: hidden;
}

.long-text-popover::before {
  border-color: var(--color-primary-highlight) transparent !important;
}

.long-text-popover__inner {
  display: flex;
  flex-direction: column;
  max-width: 42rem;
  min-width: 22rem;
  color: var(--color-text-primary);
}

.long-text-popover__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.55rem 0.85rem;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--color-primary-highlight) 22%, var(--color-background-light)),
    var(--color-background-light)
  );
}

.long-text-popover__label {
  font-size: var(--text-sm);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-bright);
}

.long-text-popover__copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.75rem;
  font-size: var(--icon-xs);
  font-weight: 600;
  background-color: var(--color-background-dark);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.long-text-popover__copy-btn:hover {
  background-color: var(--color-primary-highlight);
  color: white;
  border-color: var(--color-primary-highlight);
}

.long-text-popover__copy-btn--copied,
.long-text-popover__copy-btn--copied:hover {
  background-color: var(--color-primary-highlight);
  color: white;
  border-color: var(--color-primary-highlight);
}

.long-text-popover__copy-btn i {
  font-size: var(--text-md);
}

.long-text-popover__body {
  padding: 0.85rem 0.95rem;
  max-height: 26rem;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: var(--text-md);
  line-height: 1.5;
  color: var(--color-text-primary);
  background-color: var(--color-background-darkest);
  user-select: text;
}
</style>
