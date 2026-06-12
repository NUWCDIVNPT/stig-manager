<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { deleteCollection, fetchCollection } from '../../../shared/api/collectionsApi.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useCurrentUser } from '../../../shared/composables/useCurrentUser.js'
import { useGlobalError } from '../../../shared/composables/useGlobalError.js'
import { useRecentViews } from '../../NavRail/composables/useRecentViews.js'
import { collectionDialogPt, collectionInputTextPt } from './pt.js'

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
})

const router = useRouter()
const { triggerError } = useGlobalError()
const { refreshUser } = useCurrentUser()
const { removeView } = useRecentViews()

const { execute: fetchSource } = useAsyncState(
  id => fetchCollection(id),
  { immediate: false },
)

const collectionName = ref('')

watch(() => props.collectionId, async (id) => {
  if (!id) {
    return
  }
  const data = await fetchSource(id)
  if (data) {
    collectionName.value = data.name
  }
}, { immediate: true })

const showDeleteModal = ref(false)
const confirmationName = ref('')
const deleting = ref(false)

const nameMatches = computed(() =>
  !!collectionName.value && confirmationName.value.trim() === collectionName.value,
)

const openDeleteModal = () => {
  confirmationName.value = ''
  showDeleteModal.value = true
}

// Highlight the confirmation input as invalid once the user has typed
// something that doesn't match.
const confirmInputPt = computed(() =>
  collectionInputTextPt(!!confirmationName.value && !nameMatches.value),
)

const performDelete = async () => {
  if (!nameMatches.value || deleting.value) {
    return
  }
  deleting.value = true
  try {
    await deleteCollection(props.collectionId)
    showDeleteModal.value = false
    removeView(key => key.includes(`:${props.collectionId}`))
    // The collection's grant no longer exists; refresh so the nav rail and
    // breadcrumb drop the deleted collection.
    await refreshUser()
    // Redirect to the collections list after delete
    router.push('/collections')
  }
  catch (err) {
    triggerError(err)
  }
  finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="manage-delete">
    <div class="danger-zone">
      <div class="danger-zone-header">
        <i class="pi pi-exclamation-triangle danger-icon" />
        <h3>Delete Collection</h3>
      </div>
      <p class="danger-zone-desc">
        Permanently remove this collection and all of its data, including all Assets and their associated assessments. This action cannot be undone.
      </p>
      <Button
        label="Delete Collection"
        icon="pi pi-trash"
        severity="danger"
        @click="openDeleteModal"
      />
    </div>

    <!-- DELETE CONFIRMATION MODAL (requires typing the collection name) -->
    <Dialog
      v-model:visible="showDeleteModal"
      modal
      :style="{ width: '520px' }"
      :pt="collectionDialogPt"
    >
      <template #header>
        <div class="modal-header-danger">
          <i class="pi pi-exclamation-triangle danger-icon" />
          <span>Delete Collection</span>
        </div>
      </template>
      <div class="modal-content">
        <div class="delete-warning-box">
          <p>
            Deleting this Collection will remove all data associated with the Collection. This includes all Assets and their associated assessments.
          </p>
          <p class="warning-emphasis">
            <b>This action cannot be undone.</b>
          </p>
        </div>
        <div class="labeled-field">
          <label class="flabel" for="deleteConfirmName">
            Type <b class="confirm-name">{{ collectionName }}</b> to confirm
          </label>
          <InputText
            id="deleteConfirmName"
            v-model="confirmationName"
            :pt="confirmInputPt"
            autocomplete="off"
            :placeholder="collectionName"
            @keyup.enter="performDelete"
          />
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" :disabled="deleting" @click="showDeleteModal = false" />
        <Button
          label="Delete Collection"
          icon="pi pi-trash"
          severity="danger"
          :disabled="!nameMatches || deleting"
          :loading="deleting"
          @click="performDelete"
        />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
@import "./collection-manage.css";

.manage-delete {
  max-width: 700px;
  width: 100%;
  margin: 0 auto;
}

.danger-zone {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  border: 1px solid color-mix(in srgb, var(--color-text-error) 40%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, var(--color-text-error) 4%, var(--color-background-subtle));
}

.danger-zone-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.danger-zone-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--color-text-bright);
}

.danger-zone-desc {
  margin: 0;
  color: var(--color-text-dim);
}

.danger-icon {
  color: var(--color-text-error);
  font-size: 1.35rem;
}

.modal-header-danger {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: var(--color-text-bright);
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  color: var(--color-text-primary);
  font-size: 1.05rem;
  line-height: 1.5;
}

.delete-warning-box {
  background: color-mix(in srgb, var(--color-text-error) 6%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-text-error) 20%, transparent);
  border-left: 4px solid var(--color-text-error);
  border-radius: 6px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.delete-warning-box p {
  margin: 0;
}

.warning-emphasis {
  color: var(--color-text-error);
}

.confirm-name {
  color: var(--color-text-bright);
  user-select: none;
}
</style>
