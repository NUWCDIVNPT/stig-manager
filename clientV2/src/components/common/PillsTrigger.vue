<script setup>
import { computed } from 'vue'
import { MAX_VISIBLE_PILLS } from './pillsPicker.js'

// Chip row that is the trigger of a pills picker (the MultiSelect #value slot):
// removable chips for the applied options, the rest folded into "+N", then a chevron.
const props = defineProps({
  // [{ key, name, style?, class?, ...anything the remove handler needs }]
  pills: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    required: true,
  },
  // Text before the chips, e.g. "Excluding"
  prefix: {
    type: String,
    default: '',
  },
  // While the overlay is open chip remove is hidden (space kept): removing would reset the draft
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['remove'])

const visiblePills = computed(() => props.pills.slice(0, MAX_VISIBLE_PILLS))
const hiddenPillCount = computed(() => props.pills.length - visiblePills.value.length)
</script>

<template>
  <div class="trigger-pills">
    <span v-if="!pills.length" class="trigger-pills__placeholder">{{ placeholder }}</span>
    <template v-else>
      <span v-if="prefix" class="trigger-pills__mode">{{ prefix }}</span>
      <span class="trigger-pills__chips">
        <span
          v-for="pill in visiblePills"
          :key="pill.key"
          class="trigger-pills__chip"
          :class="pill.class"
          :style="pill.style"
        >
          <span class="trigger-pills__name">{{ pill.name }}</span>
          <button
            type="button"
            class="trigger-pills__remove"
            :style="open ? { visibility: 'hidden' } : null"
            :title="`Remove ${pill.name}`"
            :aria-label="`Remove ${pill.name}`"
            @click.stop.prevent="emit('remove', pill)"
          >
            <i class="pi pi-times" />
          </button>
        </span>
        <span v-if="hiddenPillCount" class="trigger-pills__more">+{{ hiddenPillCount }}</span>
      </span>
    </template>
    <span class="trigger-pills__chevron"><i class="pi pi-chevron-down" /></span>
  </div>
</template>

<style scoped>
.trigger-pills {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0.3rem;
  min-width: 0;
}

.trigger-pills__mode {
  flex-shrink: 0;
  font-size: var(--text-md);
  color: var(--color-text-dim);
  white-space: nowrap;
}

/* Shrinks when the menu bar runs out of room: names ellipsize, then the row clips */
.trigger-pills__chips {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  min-width: 0;
  overflow: hidden;
}

/* Sized like LabelsRow's .label-tag (grid label cells) */
.trigger-pills__chip {
  display: inline-flex;
  flex: 0 1 auto;
  align-items: center;
  min-width: 2.75rem;
  gap: 0.3rem;
  padding: 0.12rem 0.5rem;
  border-radius: 6px;
  font-size: var(--text-md);
  font-weight: 600;
  white-space: nowrap;
}

/* For options without a colour of their own */
.trigger-pills__chip--neutral {
  border: 1px solid var(--color-border-default);
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.trigger-pills__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trigger-pills__remove {
  display: inline-grid;
  flex-shrink: 0;
  place-items: center;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font-size: var(--icon-xs);
  opacity: 0.7;
  cursor: pointer;
}

.trigger-pills__remove:hover {
  opacity: 1;
}

.trigger-pills__more {
  flex-shrink: 0;
  padding: 0.08rem 0.4rem;
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  background: var(--color-bg-hover);
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--color-text-primary);
}

.trigger-pills__placeholder {
  font-size: var(--text-lg);
  color: var(--color-text-dim);
  white-space: nowrap;
}

.pills-picker:hover .trigger-pills__placeholder {
  color: var(--color-text-primary);
  text-decoration: underline;
}

/* Same chevron box as BreadcrumbSelect's picker-only mode */
.trigger-pills__chevron {
  display: inline-grid;
  flex-shrink: 0;
  place-items: center;
  margin-left: 0.15rem;
  padding: 0.18rem 0.32rem;
  border: 1px solid var(--color-border-default);
  border-radius: 0.25rem;
  background-color: var(--color-bg-hover);
  color: var(--color-text-primary);
  transition: background-color 0.15s, border-color 0.15s;
}

.trigger-pills__chevron .pi {
  font-size: var(--icon-xs);
}

.pills-picker:hover .trigger-pills__chevron {
  background-color: var(--color-bg-hover-strong);
  border-color: var(--color-text-dim);
}
</style>
