<script setup>
// Simple close button component for dialog modals
const props = defineProps({
  onClick: {
    type: Function,
    default: null,
  },
})

function handleClick() {
  if (props.onClick) {
    props.onClick()
  }
}
</script>

<template>
  <button class="close-btn" type="button" aria-label="Close" @click="handleClick">
    ×
  </button>
</template>

<style scoped>
.close-btn {
  width: 24px;
  height: 24px;
  border: none;
  outline: none;
  background: transparent;
  color: #fff;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: #b0b0b0;
}

.close-btn:active {
  color: #ffffff;
}

.close-btn:focus {
  outline: none;
}
</style>
