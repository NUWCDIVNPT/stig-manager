<script setup>
import { ref } from 'vue'

defineProps({
  asset: {
    type: Object,
    required: true,
  },
  resolvedLabels: {
    type: Array,
    default: () => [],
  },
  searchFilter: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:searchFilter'])

const searchInput = ref(null)

function clearSearch() {
  emit('update:searchFilter', '')
  searchInput.value?.focus()
}
</script>

<template>
  <header class="asset-review__header">
    <div class="asset-review__header-main">
      <div class="asset-review__header-info">
        <div class="asset-review__title-row">
          <h1 class="asset-review__title">
            Asset: {{ asset.name }}
          </h1>
          <div v-if="resolvedLabels.length" class="asset-review__labels">
            <span
              v-for="label in resolvedLabels"
              :key="label.labelId"
              class="asset-label"
              :style="{ backgroundColor: label.bgColor, color: label.textColor }"
            >
              {{ label.name }}
            </span>
          </div>
        </div>
        <div class="asset-review__meta">
          <span class="asset-review__meta-item">
            <i class="pi pi-hashtag" />
            ID:{{ asset.assetId }}
          </span>
          <span v-if="asset.ip" class="asset-review__meta-item">
            <i class="pi pi-globe" />
            {{ asset.ip }}
          </span>
        </div>
      </div>
      <div class="asset-review__header-actions">
        <div class="search-reviews">
          <i class="pi pi-search search-reviews__icon" />
          <input
            ref="searchInput"
            :value="searchFilter"
            type="text"
            class="search-reviews__input"
            placeholder="Search reviews..."
            @input="$emit('update:searchFilter', $event.target.value)"
          >
          <i
            v-if="searchFilter"
            class="pi pi-times search-reviews__clear"
            @click="clearSearch"
          />
        </div>
        <button type="button" class="action-btn" title="Import checklist">
          <i class="pi pi-upload" />
          <span>Import</span>
        </button>
        <button type="button" class="action-btn" title="Export checklist">
          <i class="pi pi-download" />
          <span>Export</span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.asset-review__header {
  padding: 0.35rem 0.75rem;
  background-color: var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-default);
}

.asset-review__header-main {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: 1rem;
  height: 3.5rem;
  overflow: hidden;
}

.asset-review__header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.asset-review__title-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.asset-review__title {
  font-size: 1.5rem;
  margin: 0.2rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asset-review__labels {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.asset-label {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  background-color: var(--color-action-blue);
  color: var(--color-text-bright);
  border-radius: 9999px;
  font-size: 0.9rem;
  font-weight: 600;
}

.asset-review__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  color: var(--color-text-dim);
  font-size: 1rem;
}

.asset-review__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.asset-review__meta-item i {
  font-size: 0.75rem;
  opacity: 0.7;
}

.asset-review__header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
  flex-shrink: 1;
  min-width: 0;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background-color: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  color: var(--color-text-primary);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  background-color: var(--color-bg-hover-strong);
  border-color: var(--color-border-default);
}

.action-btn i {
  font-size: 1rem;
}

.search-reviews {
  display: flex;
  align-items: stretch;
  position: relative;
  flex-shrink: 0;
}

.search-reviews__icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-dim);
  font-size: 1rem;
  pointer-events: none;
}

.search-reviews__input {
  background-color: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  color: var(--color-text-primary);
  font-size: 1.3rem;
  padding: 0.5rem 0.75rem 0.5rem 2.25rem;
  width: 300px;
  min-width: 100px;
  height: 100%;
  outline: none;
  transition: border-color 0.15s, background-color 0.15s;
}

.search-reviews__input::placeholder {
  color: var(--color-text-dim);
}

.search-reviews__input:focus {
  border-color: var(--color-primary-highlight);
  background-color: var(--color-background-dark);
}

.search-reviews__clear {
  position: absolute;
  right: 0.65rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-dim);
  font-size: 0.85rem;
  cursor: pointer;
}

.search-reviews__clear:hover {
  color: var(--color-text-primary);
}

.search-reviews__input:not(:placeholder-shown) {
  padding-right: 1.75rem;
}
</style>
