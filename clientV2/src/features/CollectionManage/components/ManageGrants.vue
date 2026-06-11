<script setup>
defineProps({
  collectionId: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div class="manage-grants">
    <div class="grants-content">
      <div class="settings-group">
        <h3 class="group-title">
          Access Grants
        </h3>
        <p class="group-desc">
          Add, edit, and remove user and group access grants for this collection.
        </p>
        <div class="stub-box">
          <i class="pi pi-shield stub-icon" />
          <span>Grants Administration UI Placeholder</span>
        </div>
      </div>

      <div class="settings-group">
        <h3 class="group-title">
          Effective Users
        </h3>
        <p class="group-desc">
          View resolved user access, including permissions inherited from group memberships.
        </p>
        <div class="stub-box">
          <i class="pi pi-users stub-icon" />
          <span>Effective Users List Placeholder</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "./collection-manage.css";

.manage-grants {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.grants-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 700px;
  width: 100%;
  margin: 0 auto;
  padding: 0.25rem 0;
}

.stub-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  border: 1px dashed var(--color-border-default);
  border-radius: 6px;
  color: var(--color-text-dim);
  gap: 0.75rem;
  font-size: 0.95rem;
}

.stub-icon {
  font-size: 2rem;
  opacity: 0.6;
}
</style>
