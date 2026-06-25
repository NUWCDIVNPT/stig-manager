<script setup>
import { ref } from 'vue'
import GrantsPanel from '../../../components/common/grants/GrantsPanel.vue'
import ScrollSpyLayout from '../../../components/common/ScrollSpyLayout.vue'
import GrantAclModal from './User/GrantAclModal.vue'
import ManageUsers from './User/ManageUsers.vue'

defineProps({
  collectionId: {
    type: [String, Number],
    required: true,
  },
})

const sections = [
  { id: 'grants', title: 'Grants', icon: 'pi-shield', desc: 'Add, edit, and remove user and group access grants for this collection' },
  { id: 'users', title: 'Effective Users', icon: 'pi-users', desc: 'Resolved user access, including permissions inherited from group memberships' },
]

// Grant ACL editor
const aclVisible = ref(false)
const aclGrant = ref(null)

function onOpenAcl(grant) {
  aclGrant.value = grant
  aclVisible.value = true
}
</script>

<template>
  <div class="manage-grants">
    <ScrollSpyLayout :sections="sections">
      <template #grants>
        <div class="panel-frame">
          <GrantsPanel
            :collection-id="collectionId"
            :show-header="false"
            @open-acl="onOpenAcl"
          />
        </div>
      </template>

      <template #users>
        <div class="panel-frame">
          <ManageUsers :collection-id="collectionId" />
        </div>
      </template>
    </ScrollSpyLayout>

    <GrantAclModal
      v-model:visible="aclVisible"
      :collection-id="collectionId"
      :grant="aclGrant"
    />
  </div>
</template>

<style scoped>
.manage-grants {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  overflow: hidden;
}

.panel-frame {
  display: flex;
  flex-direction: column;
  height: 60vh;
  min-height: 360px;
}
</style>
