<script setup>
import { computed } from 'vue'
import { fieldMatches, highlightText } from '../../shared/lib/searchUtils.js'

// Plain text that wraps the parts matching a search term in <mark>. Used by
// grid cells so a searched row shows why it is there.
const props = defineProps({
  text: {
    type: [String, Number],
    default: '',
  },
  term: {
    type: String,
    default: '',
  },
})

const value = computed(() => props.text == null ? '' : String(props.text))
const query = computed(() => (props.term ?? '').trim().toLowerCase())
const matched = computed(() => fieldMatches(value.value, query.value))
const html = computed(() => highlightText(value.value, query.value))
</script>

<template>
  <span v-if="matched" class="cell--match" v-html="html" />
  <span v-else>{{ value }}</span>
</template>
