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
          <div class="asset-review__title-block">
            <h1 class="asset-review__title">
              {{ asset.name }}
            </h1>
            <div class="asset-review__meta">
              <span class="asset-review__meta-item asset-review__meta-item--strong">
                <i class="pi pi-hashtag" />
                <span>ID {{ asset.assetId }}</span>
              </span>
              <span v-if="asset.ip" class="asset-review__meta-item">
                <i class="pi pi-globe" />
                <span>{{ asset.ip }}</span>
              </span>
            </div>
          </div>
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
        <button type="button" class="action-btn action-btn--secondary" title="Import checklist">
          <i class="pi pi-upload" />
          <span>Import</span>
        </button>
        <button type="button" class="action-btn action-btn--primary" title="Export checklist">
          <i class="pi pi-download" />
          <span>Export</span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.asset-review__header {
  --asset-header-row-height: 5rem;
  padding: 0.28rem 0.75rem;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-background-light) 55%, transparent), transparent 70%),
    var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-default);
}

.asset-review__header-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.85rem;
  min-height: var(--asset-header-row-height);
  flex-wrap: nowrap;
}

.asset-review__header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  min-width: 0;
  min-height: var(--asset-header-row-height);
  justify-content: center;
  overflow: hidden;
}

.asset-review__eyebrow {
  font-size: 0.56rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-dim);
  line-height: 1;
}

.asset-review__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  flex-wrap: nowrap;
  min-width: 0;
  overflow: hidden;
}

.asset-review__title-block {
  display: flex;
  flex-direction: column;
  gap: 0.14rem;
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

.asset-review__title {
  font-size: 1.02rem;
  line-height: 1.05;
  margin: 0;
  font-weight: 650;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asset-review__labels {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
  flex-wrap: nowrap;
  overflow: hidden;
  max-width: min(32rem, 45%);
}

.asset-label {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0.12rem 0.38rem;
  background-color: var(--color-action-blue);
  color: var(--color-text-bright);
  border-radius: 9999px;
  font-size: 0.66rem;
  font-weight: 600;
  line-height: 1;
}

.asset-review__meta {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.28rem;
  color: var(--color-text-dim);
  font-size: 0.7rem;
  overflow: hidden;
}

.asset-review__meta-item {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 0.25rem;
  padding: 0.1rem 0.35rem;
  border: 1px solid color-mix(in srgb, var(--color-border-default) 85%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-background-light) 55%, transparent);
}

.asset-review__meta-item--strong {
  color: var(--color-text-primary);
}

.asset-review__meta-item i {
  font-size: 0.58rem;
  opacity: 0.7;
}

.asset-review__header-actions {
  display: flex;
  gap: 0.35rem;
  align-items: center;
  flex-wrap: nowrap;
  justify-content: flex-end;
  flex: 0 1 28rem;
  min-height: var(--asset-header-row-height);
  min-width: 0;
  overflow: hidden;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  height: 1.7rem;
  padding: 0.22rem 0.62rem;
  border: 1px solid var(--color-border-default);
  border-radius: 999px;
  color: var(--color-text-primary);
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s, color 0.15s, transform 0.15s;
  flex-shrink: 0;
  white-space: nowrap;
}

.action-btn:hover {
  transform: translateY(-1px);
}

.action-btn--secondary {
  background-color: transparent;
}

.action-btn--secondary:hover {
  background-color: color-mix(in srgb, var(--color-background-light) 75%, transparent);
  border-color: color-mix(in srgb, var(--color-text-dim) 35%, var(--color-border-default));
}

.action-btn--primary {
  background-color: color-mix(in srgb, var(--color-primary-highlight) 16%, var(--color-background-light));
  border-color: color-mix(in srgb, var(--color-primary-highlight) 50%, var(--color-border-default));
}

.action-btn--primary:hover {
  background-color: color-mix(in srgb, var(--color-primary-highlight) 22%, var(--color-background-light));
  border-color: var(--color-primary-highlight);
}

.action-btn i {
  font-size: 0.72rem;
}

.search-reviews {
  display: flex;
  align-items: stretch;
  position: relative;
  flex: 1 1 14rem;
  min-width: 0;
  height: 1.7rem;
}

.search-reviews__icon {
  position: absolute;
  left: 0.58rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-dim);
  font-size: 0.72rem;
  pointer-events: none;
}

.search-reviews__input {
  background-color: color-mix(in srgb, var(--color-background-light) 85%, transparent);
  border: 1px solid var(--color-border-default);
  border-radius: 999px;
  color: var(--color-text-primary);
  font-size: 0.76rem;
  padding: 0.2rem 0.68rem 0.2rem 1.8rem;
  width: 100%;
  min-width: 0;
  height: 100%;
  outline: none;
  transition: border-color 0.15s, background-color 0.15s;
}

.search-reviews__input::placeholder {
  color: var(--color-text-dim);
}

.search-reviews__input:focus {
  border-color: var(--color-primary-highlight);
  background-color: var(--color-background-darkest);
}

.search-reviews__clear {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-dim);
  font-size: 0.64rem;
  cursor: pointer;
}

.search-reviews__clear:hover {
  color: var(--color-text-primary);
}

.search-reviews__input:not(:placeholder-shown) {
  padding-right: 1.75rem;
}

@media (max-width: 720px) {
  .asset-review__header {
    padding: 0.32rem 0.65rem;
  }

  .asset-review__meta {
    flex-wrap: wrap;
  }

  .asset-review__title {
    font-size: 0.96rem;
  }

  .asset-review__header-actions {
    gap: 0.35rem;
    flex-wrap: nowrap;
  }

  .search-reviews {
    min-width: 0;
  }

  .action-btn {
    flex: 0 0 auto;
  }
}
</style>
