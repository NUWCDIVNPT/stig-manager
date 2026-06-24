<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Menu from 'primevue/menu'
import { computed, ref, watch } from 'vue'
import targetSvg from '../../../../assets/target.svg'
import { useGrantAcl } from '../../composables/useGrantAcl.js'
import { getAclRuleKey, getAllowedAclAccessOptions, isDuplicateAclRule } from '../../lib/aclRules.js'
import { getGrantDisplay } from '../../lib/grantsUsers.js'
import AclRuleBuilder from './AclRuleBuilder.vue'
import AclRulesTable from './AclRulesTable.vue'

const props = defineProps({
  collectionId: {
    type: [String, Number],
    required: true,
  },
  grant: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['saved'])
const visible = defineModel('visible', { type: Boolean, default: false })

const { defaultAccess, rules, isLoading, isSaving, load, save } = useGrantAcl()

const granteeName = computed(() => getGrantDisplay(props.grant).title)
const accessOptions = computed(() => getAllowedAclAccessOptions(props.grant?.roleId))

// ---- Add a rule (driven by the builder's live preview) ----
const previewRule = ref(null)
const canAdd = computed(() =>
  !!previewRule.value && !isDuplicateAclRule(rules.value, previewRule.value))

const ACCESS_MENU_LABEL = {
  rw: 'with Read/Write access',
  r: 'with Read Only access',
  none: 'with No access',
}

const addMenu = ref()
const addMenuItems = computed(() => accessOptions.value.map(option => ({
  label: ACCESS_MENU_LABEL[option.value],
  icon: 'pi pi-angle-double-right',
  command: () => addRule(option.value),
})))

function toggleAddMenu(event) {
  addMenu.value.toggle(event)
}

function addRule(access) {
  if (!canAdd.value) {
    return
  }
  rules.value = [...rules.value, { ...previewRule.value, access }]
}

// ---- Remove selected rules ----
const selectedRules = ref([])

function removeSelected() {
  if (!selectedRules.value.length) {
    return
  }
  const keys = new Set(selectedRules.value.map(getAclRuleKey))
  rules.value = rules.value.filter(rule => !keys.has(getAclRuleKey(rule)))
  selectedRules.value = []
}

// Replace the edited rule immutably rather than mutating it in place.
function updateRuleAccess({ rule, access }) {
  rules.value = rules.value.map(item => (item === rule ? { ...item, access } : item))
}

// ---- Lifecycle ----
watch([visible, () => props.grant?.grantId], ([isOpen, grantId]) => {
  if (isOpen && grantId) {
    selectedRules.value = []
    load(props.collectionId, grantId)
  }
}, { immediate: true })

async function onSave() {
  const ok = await save(props.collectionId, props.grant.grantId)
  if (ok) {
    emit('saved')
    visible.value = false
  }
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :pt="{
      root: { style: 'width: 1150px; max-width: 97vw; height: 700px;' },
      content: { style: 'flex: 1 1 auto; display: flex; flex-direction: column; overflow: hidden;' },
    }"
  >
    <template #header>
      <div class="modal-title">
        <img :src="targetSvg" alt="Target icon">
        <div class="title-text">
          <span class="title-main">Access Control List for {{ granteeName }}</span>
          <span class="title-sub">Default access = {{ defaultAccess }}</span>
        </div>
      </div>
    </template>

    <div class="acl-body" :class="{ loading: isLoading }">
      <div class="acl-col resource-col">
        <h4 class="col-header">
          Add a Resource Rule
        </h4>
        <AclRuleBuilder
          :collection-id="collectionId"
          :rules="rules"
          :active="visible && !!grant"
          @preview="previewRule = $event"
        />
      </div>

      <!-- Add / Remove controls -->
      <div class="acl-controls">
        <Button
          label="Add"
          icon="pi pi-angle-down"
          icon-pos="right"
          severity="secondary"
          :disabled="!canAdd"
          class="control-btn"
          :pt="{ icon: ({ context }) => ({ style: context?.disabled ? {} : { color: 'var(--color-success)' } }) }"
          @click="toggleAddMenu"
        />
        <Menu
          ref="addMenu"
          :model="addMenuItems"
          popup
          :pt="{ itemIcon: { style: 'color: var(--color-success);' } }"
        />
        <Button
          label="Remove"
          icon="pi pi-angle-left"
          severity="secondary"
          :disabled="!selectedRules.length"
          class="control-btn"
          :pt="{ icon: ({ context }) => ({ style: context?.disabled ? {} : { color: 'var(--color-action-red)' } }) }"
          @click="removeSelected"
        />
      </div>

      <!-- Rules table -->
      <div class="acl-col rules-col">
        <h4 class="col-header">
          ACL Rules, default access = {{ defaultAccess }}
        </h4>
        <AclRulesTable
          v-model:selection="selectedRules"
          :rules="rules"
          :access-options="accessOptions"
          :loading="isLoading"
          @access-change="updateRuleAccess"
        />
      </div>
    </div>

    <template #footer>
      <Button label="Cancel" icon="pi pi-times" text :disabled="isSaving" @click="visible = false" />
      <Button label="Save" icon="pi pi-check" :loading="isSaving" @click="onSave" />
    </template>
  </Dialog>
</template>

<style scoped>
.modal-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modal-title > img {
  width: 2rem;
  height: 2rem;
}

.title-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.title-main {
  font-weight: 700;
  font-size: 1.6rem;
}

.title-sub {
  font-size: 1.1rem;
  color: var(--color-text-dim);
}

.acl-body {
  display: flex;
  gap: 0.75rem;
  flex: 1 1 auto;
  min-height: 0;
}

.acl-col {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  overflow: hidden;
}

.resource-col {
  flex: 0 0 340px;
}

.acl-controls {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  gap: 1.2rem;
  padding: 0 0.25rem;
}

.control-btn {
  min-width: 7rem;
  padding: 0.6rem 1rem;
  font-size: 1.1rem;
}

.rules-col {
  flex: 1 1 auto;
}

.col-header {
  margin: 0;
  padding: 0.75rem 1rem;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-text-bright);
  background: var(--p-datatable-row-background);
  border-bottom: 1px solid var(--color-border-default);
}
</style>
