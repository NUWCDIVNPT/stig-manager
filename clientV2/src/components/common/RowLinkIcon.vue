<script setup>
import { RouterLink } from 'vue-router'

// A real link so Ctrl/middle-click, Copy link and the hover URL work. .stop keeps the
// click from selecting the row; navigate() leaves modified clicks to the browser.
defineProps({
  to: {
    type: [Object, String],
    default: null,
  },
  icon: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  alt: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <RouterLink v-if="to" v-slot="{ href, navigate }" :to="to" custom>
    <a :href="href" class="shield-action" :title="title" @click.stop="navigate">
      <img :src="icon" width="14" height="14" :alt="alt">
    </a>
  </RouterLink>
</template>
