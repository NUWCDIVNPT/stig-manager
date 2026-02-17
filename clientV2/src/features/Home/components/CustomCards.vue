<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Editor from 'primevue/editor'
import InputText from 'primevue/inputtext'
import { computed, inject, onMounted, ref } from 'vue'
import CloseButton from '../../../components/common/CloseButton.vue'

const worker = inject('worker', null)

const userRoles = computed(() => {
  if (!worker?.tokenParsed) {
    return []
  }
  try {
    return worker.tokenParsed.realm_access.roles || []
  }
  catch {
    return []
  }
})

const isAdmin = computed(() => {
  return userRoles.value.includes('admin')
})

const customCards = ref([]) // cards
const showDialog = ref(false) // create card dialog
const newCardTitle = ref('') // new card title
const newCardContent = ref('') // new card content
const isFormValid = computed(() => {
  // Strip HTML tags to check if editor has actual content
  const textContent = newCardContent.value.replace(/<[^>]*>/g, '').trim()
  return newCardTitle.value.trim().length > 0 && textContent.length > 0
})

const showDeleteDialog = ref(false) // delete card dialog
const cardToDeleteId = ref(null) // card to delete
const editMode = ref(false)
const editingCardId = ref(null)
const reorderMode = ref(false)

function openCreateDialog() {
  editMode.value = false
  editingCardId.value = null
  newCardTitle.value = ''
  newCardContent.value = ''
  showDialog.value = true
}

function openEditDialog(card) {
  editMode.value = true
  editingCardId.value = card.id
  newCardTitle.value = card.title
  newCardContent.value = card.content
  showDialog.value = true
}

async function saveCard() {
  if (!newCardTitle.value.trim()) {
    return
  }

  if (editMode.value && editingCardId.value) {
    // edit existing
    const index = customCards.value.findIndex(c => c.id === editingCardId.value)
    // returns -1 if not found
    if (index !== -1) {
      // merge objects
      customCards.value[index] = {
        ...customCards.value[index],
        title: newCardTitle.value.trim(),
        content: newCardContent.value.trim(),
      }
    }
  }
  else {
    // create new
    customCards.value.push({
      id: Date.now(),
      title: newCardTitle.value.trim(),
      content: newCardContent.value.trim(),
      isCustom: true,
      date: new Date().toISOString(),
    })
  }

  resetForm()
  showDialog.value = false

  // do fake request will need logic here for request method a eventually
  await new Promise(resolve => setTimeout(resolve, 500))
}

function deleteCard(id) {
  cardToDeleteId.value = id
  showDeleteDialog.value = true
}

function confirmDelete() {
  if (cardToDeleteId.value) {
    customCards.value = customCards.value.filter(card => card.id !== cardToDeleteId.value)
    cardToDeleteId.value = null
  }
  showDeleteDialog.value = false
}

function resetForm() {
  newCardTitle.value = ''
  newCardContent.value = ''
  editMode.value = false
  editingCardId.value = null
}

function cancelNewCard() {
  resetForm()
  showDialog.value = false
}

const createCardDialogPt = {
  root: {
    style: 'background-color: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 6px; color: var(--color-text-primary); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); width: 900px;',
  },
  header: {
    style: 'background-color: var(--color-background-dark); color: var(--color-text-primary); border-top-left-radius: 6px; border-top-right-radius: 6px; border-bottom: 1px solid #27272a;',
  },
  content: {
    style: 'background-color: #18181b; color: var(--color-text-primary); border-bottom-left-radius: 6px; border-bottom-right-radius: 6px; padding: 1.5rem;',
  },
  closeButton: {
    style: 'color: #a1a1aa;',
  },
  title: {
    style: 'font-size: 1.5rem; font-weight: 600;',
  },
}

const deleteDialogPt = {
  root: {
    style: 'background-color: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 6px; color: var(--color-text-primary); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); width: 400px;',
  },
  header: {
    style: 'background-color: var(--color-background-dark); color: var(--color-text-primary); border-top-left-radius: 6px; border-top-right-radius: 6px; padding: 1rem; border-bottom: 1px solid #27272a;',
  },
  content: {
    style: 'background-color: #18181b; color: var(--color-text-primary); border-bottom-left-radius: 6px; border-bottom-right-radius: 6px; padding: 1.5rem;',
  },
  closeButton: {
    style: 'color: #a1a1aa;',
  },
  title: {
    style: 'font-size: 1.5rem; font-weight: 600;',
  },
}

function formatDate(date) {
  if (!date) {
    return ''
  }
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

async function fetchCards() {
  await new Promise(resolve => setTimeout(resolve, 500))
  customCards.value = [
    {
      id: 6,
      title: 'Super Massive Compliance Report',
      content: '<p><strong>Section 1: Overview<//p><p>This is a very long report to test the height calculation logic. It really long. Like, significantly long.</p><p>Lor</p><p>This iseds to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to/p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to/p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to/p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to/p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to</p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lor</p><p>This is a very long report to test the height calculation logic. It needs to be really long. Like, significantly long.</p><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum vestibulum. Cras venenatis euismod malesuada. Nullam ac odio ténellus, ullamcorper libero nec, lacinia ex.</p><br><p><strong>Section 2: Details</strong></p><p>Suspendisse potenti. Proin eget tortor risus. Curabitur aliquet quam id dui posuere blandit. Nulla quis lorem ut libero malesuada feugiat. Mauris blandit aliquet elit, eget tincidunt nibh pulvinar a.</p><p>Vestibulum ac diam sit amet quam vehicula elementum sed sit amet dui. Sed porttitor lectus nibh. Pettitor se, cras ultricies ligula sed magna dictum porta. Donec sollicitudin molestie malesuada.</p><br><p><strong>Section 3: Conclusion</strong></p><p>Donec rutrum congue leo eget malesuada. Quisque velit nisi, pretium ut lacinia in, elementum id enim. Curabitur non nulla sit amet nisl tempus convallis quis ac lectus. Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus.</p><p>The end of the very long card.</p>',
      isCustom: true,
      date: new Date().toISOString(),
    },
    {
      id: 1,
      title: 'Getting Started Guide',
      content: '<p>Welcome to STIG Manager! Here are a few tips to get you started:</p><ul><li>Check out the Documentation tab</li><li>Review your assigned Collections</li><li>Explore the available STIGs</li></ul>',
      isCustom: true,
      date: new Date('2024-01-15').toISOString(),
    },
    {
      id: 2,
      title: 'Upcoming Maintenance',
      content: '<p><strong>Notice:</strong> The system will undergo scheduled maintenance this Saturday from 2200-2400 EST.</p>',
      isCustom: true,
      date: new Date().toISOString(),
    },
    {
      id: 3,
      title: 'Quick Status Update',
      content: '<p>Just a quick note to say the deployment went smoothly. No issues reported so far.</p>',
      isCustom: true,
      date: new Date().toISOString(),
    },
    {
      id: 4,
      title: 'Massive System Log Dump',
      content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Selit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea ed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p><p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p><p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p><p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.</p><br><p>Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?</p>',
      isCustom: true,
      date: new Date().toISOString(),
    },
    {
      id: 5,
      title: 'Meeting Notes',
      content: '<p>Discussed the Q3 roadmap. <strong>Action items:</strong></p><ul><li>Update dependency list</li><li>Refactor login flow</li><li>Schedule team outing</li></ul>',
      isCustom: true,
      date: new Date().toISOString(),
    },

    {
      id: 7,
      title: 'Tiny Reminder',
      content: '<p>Don\'t forget to drink water.</p>',
      isCustom: true,
      date: new Date().toISOString(),
    },
  ]
}

onMounted(() => {
  fetchCards()
})

defineExpose({
  customCards,
  deleteCard,
  openEditDialog,
  formatDate,
  isAdmin,
  openCreateDialog,
  reorderMode,
})
</script>

<template>
  <div v-if="isAdmin" class="floating-actions">
    <button
      v-if="!reorderMode"
      class="floating-btn add-btn"
      title="Add custom card"
      @click="openCreateDialog"
    >
      <i class="pi pi-plus" style="font-size: 1.5rem" />
    </button>
    <button
      class="floating-btn reorder-btn"
      :class="{ active: reorderMode }"
      :title="reorderMode ? 'Done editing' : 'Edit cards'"
      @click="reorderMode = !reorderMode"
    >
      <i :class="reorderMode ? 'pi pi-check' : 'pi pi-pencil'" style="font-size: 1.5rem" />
    </button>
  </div>

  <Dialog
    v-if="isAdmin"
    v-model:visible="showDialog"
    :header="editMode ? 'Edit Card' : 'Create Card'"
    modal
    :pt="createCardDialogPt"
  >
    <template #closebutton="{ closeCallback }">
      <CloseButton :on-click="closeCallback" />
    </template>
    <div class="form-group">
      <label for="card-title">Card Title:<span class="required">*</span></label>
      <InputText
        id="card-title"
        v-model="newCardTitle"
        placeholder="Enter card title..."
        maxlength="70"
      />
    </div>
    <div class="form-group">
      <label for="card-content">Card Content:<span class="required">*</span></label>
      <Editor
        id="card-content"
        v-model="newCardContent"
        editor-style="height: 320px"
        :pt="{
          root: {
            style: {
              borderRadius: '0.375rem',
            },
          },
          toolbar: {
            style: {
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderBottom: 'none',
              borderRadius: '0.375rem 0.375rem 0 0',
            },
          },
          content: {
            style: {
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0 0 0.375rem 0.375rem',
              background: 'rgba(0, 0, 0, 0.2)',
            },
          },
        }"
      >
        <template #toolbar>
          <span class="ql-formats">
            <button class="ql-bold" />
            <button class="ql-italic" />
            <button class="ql-underline" />
            <button class="ql-strike" />
          </span>
          <span class="ql-formats">
            <select class="ql-header">
              <option value="1" />
              <option value="2" />
              <option value="3" />
              <option selected />
            </select>
          </span>
          <span class="ql-formats">
            <button class="ql-list" value="ordered" />
            <button class="ql-list" value="bullet" />
          </span>
          <span class="ql-formats">
            <button class="ql-link" />
            <button class="ql-code-block" />
          </span>
          <span class="ql-formats">
            <button class="ql-clean" />
          </span>
        </template>
      </Editor>
    </div>
    <template #footer>
      <Button
        label="Cancel" severity="secondary" :pt="{
          root: {
            style: {
              outline: 'none',
              boxShadow: 'none',
            },
          },
        }" @click="cancelNewCard"
      />
      <Button
        :label="editMode ? 'Update' : 'Create'" :disabled="!isFormValid" :pt="{
          root: {
            style: {
              outline: 'none',
              boxShadow: 'none',
              background: 'var(--color-primary-highlight)',
            },
          },
        }" @click="saveCard"
      />
    </template>
  </Dialog>

  <Dialog
    v-model:visible="showDeleteDialog"
    header="Confirm Delete"
    modal
    :pt="deleteDialogPt"
  >
    <div class="confirmation-content">
      <p>Are you sure you would like to delete this?</p>
    </div>
    <template #footer>
      <Button
        label="No" severity="secondary" :pt="{
          root: {
            style: {
              outline: 'none',
              boxShadow: 'none',
            },
          },
        }" @click="showDeleteDialog = false"
      />
      <Button
        label="Yes" :pt="{
          root: {
            style: {
              outline: 'none',
              boxShadow: 'none',
            },
          },
        }" @click="confirmDelete"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.floating-actions {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  flex-direction: column-reverse;
  gap: 1rem;
  z-index: 1000;
  align-items: center;
}

.floating-btn {
  background: var(--color-primary-highlight);
  border: none;
  color: var(--color-text-primary);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.floating-btn:hover {
  background: var(--color-primary-highlight-light);
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
}

.floating-btn:active {
  transform: translateY(0) scale(0.95);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.reorder-btn {
  background: var(--color-bg-hover);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: 48px;
  height: 48px;
}

.reorder-btn:hover {
  background: var(--color-bg-hover-strong);
}

.reorder-btn.active {
  background: var(--color-primary-highlight);
  border-color: transparent;
  transform: scale(1.1);
}

.delete-btn {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  font-size: 1.5rem;
  width: 28px;
  height: 28px;
  border-radius: 0.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding: 0;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
  transform: scale(1.05);
}

.add-card-trigger {
  background: transparent;
  border: none;
  padding: 0;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-card-trigger:hover {
  background: transparent;
  transform: none;
}

.add-card-btn {
  background: none;
  border: none;
  color: var(--color-text-primary);
  font-size: 3rem;
  font-weight: 300;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: opacity 0.15s ease;
}

.add-card-btn:hover {
  opacity: 0.7;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
}

.required {
  color: #ef4444;
  margin-left: 0.25rem;
}
</style>
