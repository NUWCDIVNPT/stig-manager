<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Tree from 'primevue/tree'
import { computed, ref, watch } from 'vue'
import {
  buildChildNodes,
  buildJsonTreeNodes,
  leafDisplay,
  sizeBadge,
} from '../../features/AppManagement/Appinfo/lib/adapters/jsonTreeNodes.js'
import { useGlobalError } from '../../shared/composables/useGlobalError.js'

const { error, clearError } = useGlobalError()

const visible = computed({
  get: () => !!error.value,
  set: (val) => {
    if (!val) {
      clearError()
    }
  },
})

const nodes = ref([])
const expandedKeys = ref({})
const copied = ref(false)

// Open `error` and its direct containers (stack, body, cause) like the legacy viewer.
watch(error, (report) => {
  copied.value = false
  nodes.value = report ? buildJsonTreeNodes(report) : []
  const keys = {}
  const errorNode = nodes.value.find(n => n.key === 'error')
  if (errorNode && !errorNode.leaf) {
    keys.error = true
    for (const child of buildChildNodes(errorNode)) {
      if (!child.leaf) {
        buildChildNodes(child)
        keys[child.key] = true
      }
    }
  }
  expandedKeys.value = keys
}, { immediate: true })

function onNodeExpand(node) {
  buildChildNodes(node)
}

async function copyError() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(error.value, null, 2))
    copied.value = true
  }
  catch (e) {
    console.error('Copy to clipboard failed:', e)
  }
}

const dialogPt = {
  root: {
    style: 'background-color: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 6px; color: var(--color-text-primary); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);',
  },
  header: {
    style: 'background-color: var(--color-background-dark); color: var(--color-text-primary); border-top-left-radius: 6px; border-top-right-radius: 6px; padding: 1rem; border-bottom: 1px solid var(--color-background-light);',
  },
  content: {
    style: 'background-color: var(--color-background-dark); color: var(--color-text-primary); border-bottom-left-radius: 6px; border-bottom-right-radius: 6px; padding: 1.5rem;',
  },
  closeButton: {
    style: 'color: var(--color-text-dim);',
  },
  title: {
    style: 'font-size: var(--text-xl); font-weight: 600;',
  },
}

const treePt = {
  root: { style: 'background: transparent; border: none; padding: 0; color: var(--color-text-primary);' },
  nodeContent: { style: 'padding: 0.1rem 0.25rem; background: transparent; color: var(--color-text-primary);' },
  nodeLabel: { style: 'font-size: var(--text-md);' },
  nodeToggleButton: { style: 'width: 1.5rem; height: 1.5rem; color: var(--color-text-dim);' },
}

const buttonPt = {
  root: {
    style: 'color: var(--color-text-primary); border-color: var(--color-border-default);',
    class: 'action-btn',
  },
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="Unhandled Error"
    :style="{ width: '900px', maxWidth: '90vw' }"
    :closable="true"
    :pt="dialogPt"
  >
    <div class="error-modal-content">
      <p class="description">
        An unhandled error has occurred. You can review the error details below and copy the details to your clipboard.
      </p>
      <p class="message">
        {{ error?.message }}
      </p>

      <div class="code-box">
        <div class="box-title">
          Error Details
        </div>
        <div class="code-content custom-scrollbar">
          <Tree
            v-model:expanded-keys="expandedKeys"
            :value="nodes"
            :pt="treePt"
            @node-expand="onNodeExpand"
          >
            <template #default="{ node }">
              <span class="json-line">
                <span class="json-key">{{ node.label }}</span>
                <span v-if="sizeBadge(node.data)" class="json-size">{{ sizeBadge(node.data) }}</span>
                <template v-else>
                  <span class="json-separator">:</span>
                  <span class="json-value" :class="`json-${node.data.type}`">{{ leafDisplay(node.data) }}</span>
                </template>
              </span>
            </template>
          </Tree>
        </div>
      </div>

      <div class="actions">
        <Button
          :label="copied ? 'Copied' : 'Copy to clipboard'"
          :icon="copied ? 'pi pi-check' : 'pi pi-copy'"
          :pt="buttonPt"
          @click="copyError"
        />
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.error-modal-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  font-size: var(--text-md);
}

.description {
  margin: 0;
  color: var(--color-text-dim);
}

.message {
  margin: 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.code-box {
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  padding: 1rem 0.5rem 0.5rem;
  position: relative;
  margin-top: 0.5rem;
  background-color: var(--color-background-darkest);
}

.box-title {
  position: absolute;
  top: -12px;
  left: 0.75rem;
  padding: 0 0.25rem;
  background-color: var(--color-background-dark);
  color: var(--color-text-dim);
  font-size: var(--text-md);
  font-weight: 500;
}

.code-content {
  max-height: 55vh;
  overflow: auto;
  font-family: var(--font-mono);
}

.json-line {
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  font-family: inherit;
}

.json-key {
  color: var(--color-text-bright);
}

.json-size,
.json-separator {
  color: var(--color-text-dim);
}

.json-value {
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.json-string {
  color: var(--color-success);
}

.json-number {
  color: var(--color-action-blue);
}

.json-boolean {
  color: var(--color-warning-yellow);
}

.json-null,
.json-undefined,
.json-object,
.json-array {
  color: var(--color-text-dim);
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.action-btn:hover,
.action-btn:active,
.action-btn:focus-visible {
  background-color: rgba(96, 165, 250, 0.1) !important;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #09090b;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-border-default);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-light);
}
</style>
