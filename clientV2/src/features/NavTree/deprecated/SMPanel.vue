<script>
export default {
  props: {
    isOpen: {
      type: Boolean,
      default: true,
    },
  },
}
</script>

<template>
  <div class="panel">
    <div v-if="$slots.header" class="panel-header">
      <slot name="header" />
    </div>
    <div v-if="isOpen !== false" class="panel-body">
      <slot name="body" />
    </div>
  </div>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  border-radius: 6px;
  overflow: hidden;
}

.panel-header {
  flex: 0 0 auto;
  color: #dddad6;
  background-color: #35393b;
  font-weight: 700;
  font-size: 11px;
  padding: 6px 8px 5px;
}

.panel-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
</style>
