<script setup>
import { computed } from 'vue'
import { useGlobalAppStore } from '../../shared/stores/globalAppStore.js'

const globalAppState = useGlobalAppStore()
const classification = computed(() => globalAppState.classification || 'NONE')

class Classification {
  constructor(apiClassification) {
    this.showBanner = true
    switch (apiClassification) {
      case 'U':
        this.classificationCls = 'unclassified'
        this.classificationText = 'UNCLASSIFIED (U)'
        break
      case 'CUI':
        this.classificationCls = 'cui'
        this.classificationText = 'CONTROLLED (CUI)'
        break
      case 'FOUO':
        // FOUO is treated as controlled but uses its own color class
        this.classificationCls = 'fouo'
        this.classificationText = 'CONTROLLED (FOUO)'
        break
      case 'C':
        this.classificationCls = 'confidential'
        this.classificationText = 'CONFIDENTIAL (C)'
        break
      case 'S':
        this.classificationCls = 'secret'
        this.classificationText = 'SECRET (S)'
        break
      case 'TS':
        this.classificationCls = 'topsecret'
        this.classificationText = 'TOP SECRET (TS)'
        break
      case 'SCI':
        this.classificationCls = 'sci'
        this.classificationText = 'TOP SECRET / SCI (TS/SCI)'
        break
      case 'NONE':
      default:
        this.showBanner = false
        break
    }
  }
}

const cls = new Classification(classification.value)
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
}
.sm-banner-body-text {
  text-align: center;
  font:
    bold 11px Open Sans,
    helvetica,
    sans-serif;
  padding-top: 1px;
  height: 12px;
  line-height: 12px;
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
  color: #000;
}
</style>
