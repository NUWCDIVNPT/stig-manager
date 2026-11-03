<script setup>
import { classificationBanner } from '../../shared/lib/classification.js'
import { useGlobalAppStore } from '../../shared/stores/globalAppStore.js'

// Read once at setup; classification is fixed for the app lifetime.
const cls = classificationBanner(useGlobalAppStore().classification)
</script>

<template>
  <div v-if="cls.showBanner" class="sm-banner" :class="[`sm-banner-${cls.classificationCls}`]">
    <div class="sm-banner-body-text">
      {{ cls.classificationText }}
    </div>
  </div>
</template>

<style scoped>
.sm-banner {
  width: 100%;
  box-sizing: border-box;
  height: var(--classification-banner-height);
}
.sm-banner-body-text {
  text-align: center;
  font-weight: bold;
  font-size: var(--text-md);
  line-height: var(--classification-banner-height);
}
.sm-banner-unclassified {
  background-color: var(--color-marking-unclassified);
  color: #fff;
}
.sm-banner-cui {
  background-color: var(--color-marking-cui);
  color: #fff;
}
.sm-banner-confidential {
  background-color: var(--color-marking-confidential);
  color: #fff;
}
.sm-banner-secret {
  background-color: var(--color-marking-secret);
  color: #fff;
}
.sm-banner-fouo {
  background-color: var(--color-marking-fouo);
  color: #fff;
}
.sm-banner-topsecret {
  background-color: var(--color-marking-topsecret);
  color: #fff;
}
.sm-banner-sci {
  background-color: var(--color-marking-sci);
  color: var(--color-text-dark);
}
</style>
