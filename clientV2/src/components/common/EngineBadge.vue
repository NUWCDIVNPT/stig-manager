<script setup>
import { computed } from 'vue'

const props = defineProps({
  count: {
    type: Number,
    default: null,
  },
})

const showBadge = computed(() => props.count && props.count > 0)
</script>

<template>
  <div
    v-if="showBadge"
    class="engine-badge"
    title="Result engine"
  >
    {{ count }}
  </div>
</template>

<style scoped>
.engine-badge {
  color: hsl(0deg 0% 80%);
  font: 600 10px Open Sans, helvetica, sans-serif;
  position: relative;
  top: 0px;
  background-color: #1e2021;
  padding: 1px 4px 2px 17px;
  border-radius: 3px;
  user-select: none;
  background-size: 12px 12px;
  background-repeat: no-repeat;
  background-position: 2px 2px;
  border: 1px solid #414749;
  display: inline-block;
  margin-left: 0px;
  background-image: url(../../assets/bot2.svg);
}
</style>
