<script setup>
import { html as renderDiffHtml } from 'diff2html'
import { computed } from 'vue'

const props = defineProps({
  propName: {
    type: String,
    required: true,
  },
  patch: {
    type: String,
    required: true,
  },
})

// Match legacy client config exactly — notably line-by-line (diff2html's default)
// avoids the empty-placeholder rows that side-by-side inserts to align columns.
const D2H_CONFIG = {
  drawFileList: false,
  matching: 'lines',
  diffStyle: 'word',
}

const rendered = computed(() => {
  if (!props.patch) {
    return null
  }
  try {
    return { html: renderDiffHtml(props.patch, D2H_CONFIG), error: false }
  }
  catch {
    return { html: '', error: true }
  }
})
</script>

<template>
  <section class="diff-property-section">
    <header class="diff-property-section__head">
      {{ propName }}
    </header>
    <div
      v-if="rendered && !rendered.error"
      class="diff-property-section__body d2h-wrapper"
      v-html="rendered.html"
    />
    <div v-else class="diff-property-section__error">
      Could not render diff for <code>{{ propName }}</code>.
    </div>
  </section>
</template>

<style scoped>
@import 'diff2html/bundles/css/diff2html.min.css';

.diff-property-section {
  background-color: var(--color-background-dark);
  border: 1px solid var(--color-border-default);
  border-radius: 0.3rem;
  overflow: hidden;
}

.diff-property-section__head {
  padding: 0.35rem 0.75rem;
  background-color: var(--color-background-subtle);
  border-bottom: 1px solid var(--color-border-default);
  font: 700 1.1rem monospace;
  color: var(--color-text-primary);
}

/* Force monospace on the diff body so the legacy d2h CSS doesn't depend on
   the scoped @import of diff2html.min.css making it through PostCSS to the
   v-html'd nodes. Diff text aligns much better in a fixed-width font. */
.diff-property-section__body {
  overflow-x: hidden;
  font-family: Menlo, Consolas, 'Liberation Mono', monospace;
}

.d2h-wrapper :deep(.d2h-code-line),
.d2h-wrapper :deep(.d2h-code-line-prefix),
.d2h-wrapper :deep(.d2h-code-line-ctn),
.d2h-wrapper :deep(.d2h-code-linenumber),
.d2h-wrapper :deep(.line-num1),
.d2h-wrapper :deep(.line-num2) {
  font-family: Menlo, Consolas, 'Liberation Mono', monospace;
}

.diff-property-section__error {
  padding: 0.75rem 1rem;
  color: var(--color-text-error);
  font-style: italic;
}

/* Dark-theme overrides for diff2html output rendered inside .d2h-wrapper via v-html.
   Ported from legacy client dark-mode.css (lines 3059-3119) and mapped onto app tokens. */
.d2h-wrapper :deep(.d2h-file-wrapper) {
  border: none;
  background-color: transparent;
}

/* Hide diff2html's own file-header (filename + "Viewed" checkbox) and hunk info
   (the `@@ -1,5 +1,5 @@` line). Our <header class="diff-property-section__head">
   already labels the property; those internals are redundant.
   `.d2h-info` is applied to the TD cells only, so we also collapse the
   containing <tr> so the row leaves zero vertical space. */
.d2h-wrapper :deep(.d2h-file-header) {
  display: none;
}

.d2h-wrapper :deep(tr:has(.d2h-info)) {
  display: none;
}

/* Make the line-number gutter a real table cell instead of diff2html's default
   `position: absolute` overlay. The overlay scheme assumes fixed (single-line)
   row heights — it breaks when we wrap content (variable row heights +
   line numbers anchored to an ancestor positioning context instead of the
   current row). With `display: table-cell` the gutter participates in normal
   table layout: the row height = max(gutter, content) and the gutter stretches
   to match. `.line-num1` / `.line-num2` remain floated so the two revision
   numbers sit side-by-side within the gutter cell. */
.d2h-wrapper :deep(.d2h-code-linenumber) {
  position: static;
  display: table-cell;
  box-sizing: border-box;
  width: 4.5rem;
  padding: 0;
  text-align: right;
  vertical-align: top;
}

.d2h-wrapper :deep(.line-num1) {
  float: left;
  box-sizing: border-box;
  width: 2.25rem;
  padding: 0 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

.d2h-wrapper :deep(.line-num2) {
  float: right;
  box-sizing: border-box;
  width: 2.25rem;
  padding: 0 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Content cell — gutter is its own column now, so no left-padding reservation.
   `white-space: normal` on the outer .d2h-code-line collapses the literal
   newline+indent diff2html leaves between the prefix and content spans in its
   HTML source; otherwise pre-wrap would turn that source whitespace into a
   real line break, pushing every line's content onto a row of its own and
   doubling row heights. The inner .d2h-code-line-ctn still uses pre-wrap
   (below) to preserve meaningful whitespace inside the actual content. */
.d2h-wrapper :deep(.d2h-code-line) {
  display: block;
  padding: 0 0.5rem;
  width: auto;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Default diff2html CSS sets `.d2h-code-line-ctn { display: inline-block; width: 100% }`,
   which — combined with our `.d2h-code-line { display: block }` wrap change —
   forces the content span to consume the full row width, bumping it onto a line
   below the `-` / `+` prefix. Flip to inline so the prefix and content flow
   together and the row is as tall as its wrapped content. */
.d2h-wrapper :deep(.d2h-code-line-prefix) {
  display: inline;
  padding-right: 0.3rem;
  white-space: pre;
}

.d2h-wrapper :deep(.d2h-code-line-ctn) {
  display: inline;
  width: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.d2h-wrapper :deep(.d2h-file-diff) {
  background-color: var(--color-background-dark);
  border: none;
}

.d2h-wrapper :deep(.d2h-code-linenumber) {
  background-color: transparent;
  color: hsl(0, 0%, 50%);
  border-right-color: var(--color-border-light);
}

.d2h-wrapper :deep(.d2h-code-side-linenumber) {
  background-color: transparent;
  color: hsl(0, 0%, 50%);
  border-right-color: var(--color-border-light);
}

.d2h-wrapper :deep(.d2h-del) {
  background-color: hsl(0, 60%, 17%);
  border-right-color: hsl(0, 59%, 20%);
}

.d2h-wrapper :deep(.d2h-ins) {
  background-color: hsl(110, 22%, 22%);
  border-right-color: hsl(120, 33%, 20%);
}

.d2h-wrapper :deep(.d2h-file-diff .d2h-del.d2h-change) {
  background-color: hsl(0, 60%, 17%);
}

.d2h-wrapper :deep(.d2h-file-diff .d2h-ins.d2h-change) {
  background-color: hsl(110, 22%, 22%);
}

.d2h-wrapper :deep(.d2h-code-line del),
.d2h-wrapper :deep(.d2h-code-side-line del) {
  background-color: hsl(0, 63%, 31%);
  text-decoration: none;
}

.d2h-wrapper :deep(.d2h-code-line ins),
.d2h-wrapper :deep(.d2h-code-side-line ins) {
  background-color: hsl(110, 35%, 30%);
  text-decoration: none;
}

.d2h-wrapper :deep(.d2h-code-line),
.d2h-wrapper :deep(.d2h-code-side-line) {
  color: var(--color-text-primary);
}

.d2h-wrapper :deep(.d2h-emptyplaceholder) {
  background-color: var(--color-background-dark);
  border-color: var(--color-border-default);
}

.d2h-wrapper :deep(.d2h-cntx) {
  background-color: var(--color-background-dark);
}
</style>
