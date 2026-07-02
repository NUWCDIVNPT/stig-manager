<script setup>
import { TOOLTIPS } from '../../../shared/lib/tooltips.js'
import HelpIcon from '../HelpIcon.vue'
</script>

<template>
  <HelpIcon :content="TOOLTIPS.roles.html" icon="pi pi-info-circle" tip-class="sm-role-tip" />
</template>
