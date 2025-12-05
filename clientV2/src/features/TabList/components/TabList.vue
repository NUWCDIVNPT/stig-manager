<script setup>
import TabListContent from './TabListContent.vue'
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <TabListContent :current-component="Component" :current-route="route" />
  </router-view>
</template>
