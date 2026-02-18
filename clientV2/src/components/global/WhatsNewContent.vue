<script setup>
defineProps({
  features: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <div class="whats-new-layout">
    <div class="feedback-panel-container">
      <div class="feedback-box-title">
        Have a Feature Request?
      </div>
      <div style="font-size: 1.1rem;">
        New features in STIG Manager are primarily driven by user requests.
        Have an idea or feature request? We'd love to hear from you!
        Please submit your suggestions by opening an issue on our
        <a href="https://github.com/NUWCDIVNPT/stig-manager/issues" target="_blank">GitHub Issues page</a>.
      </div>
    </div>

    <div class="features-scroll">
      <div class="whats-new-title">
        New Features in the STIG Manager App
      </div>
      <hr class="whats-new-divider">

      <template v-for="(feature, index) in features" :key="index">
        <div class="feature-text feature-container">
          <div class="feature-subtitle">
            {{ feature.header }}
            <span class="feature-date">({{ feature.date }})</span>
          </div>
          <div class="feature-body" v-html="feature.body" />
        </div>
        <hr v-if="index < features.length - 1" class="whats-new-divider">
      </template>
    </div>
  </div>
</template>

<style scoped>
.whats-new-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.features-scroll {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.feature-text {
  padding: 10px;
  font-size: 1.1rem;
  word-wrap: break-word;
}

.whats-new-title {
  font-size: 2rem;
  font-weight: bold;
  color: var(--color-primary-highlight);
}

.feature-subtitle {
  padding-top: 3px;
  padding-bottom: 3px;
  font-size: 1.4rem;
  font-weight: bold;
  color: var(--color-primary-highlight);
}

.feature-body :deep(img) {
  max-width: 100%;
  height: auto;
  border: 1px solid var(--p-surface-border, #3f3f46);
  border-radius: 4px;
  margin-top: 0.5rem;
}

.feature-body :deep(a) {
  color: var(--color-primary-highlight);
  text-decoration: none;
}
.feature-body :deep(a:hover) {
  text-decoration: underline;
}

.feedback-panel-container {
  background-color: var(--color-background-subtle);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  padding: 8px 16px;
  margin-bottom: 1.5rem;
  flex-shrink: 0;
}

.feedback-box-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.whats-new-divider {
  margin: 10px 16px;
  border: 0;
  border-top: 1px solid var(--color-border-light);
}

.feature-container {
  margin-bottom: 10px;
}

.feature-date {
  font-size: 70%;
  font-style: italic;
  font-weight: normal;
}
</style>
