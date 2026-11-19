<script setup>
import { TOOLTIPS } from '../../shared/lib/tooltips.js'

// Marks a Revision that is the Collection's pinned default. Consumers decide
// when to show it; the glyph, label and tooltip live here.
</script>

<template>
  <span :title="TOOLTIPS.pinnedRevision" class="icon-pin" role="img" :aria-label="TOOLTIPS.pinnedRevision" />
</template>
