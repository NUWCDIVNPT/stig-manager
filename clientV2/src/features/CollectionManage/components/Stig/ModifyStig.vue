<script setup>
import ActionButton from '../../../../components/common/ActionButton.vue'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['modify-stig'])
</script>

<template>
  <ActionButton icon="pi pi-pencil icon-grey" :disabled="props.disabled" @click="emit('modify-stig')">
    Modify
  </ActionButton>
</template>
