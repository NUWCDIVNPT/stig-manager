<script setup>
import Button from 'primevue/button'
import Popover from 'primevue/popover'
import { ref } from 'vue'

const op = ref()

const toggle = (event) => {
  op.value.toggle(event)
}
</script>

<template>
  <Button
    icon="pi pi-info-circle"
    text
    rounded
    size="small"
    class="info-icon"
    @click="toggle"
  />
  <Popover ref="op">
    <div class="role-info-content">
      <b>Roles</b> <br>
      <ul>
        <li><b class="role-text-restricted">Restricted:</b> Can access specific STIGs on specific Assets only.</li>
        <li><b class="role-text-full">Full:</b> Can access any Asset/STIG in the Collection but cannot add/remove/modify Assets, STIGs, or Grants.</li>
        <li><b class="role-text-manage">Manage:</b> Can access any Asset/STIG in the Collection and can also add/remove/modify Assets, STIGs, and Grants except for User "Owner" grants. Optionally responsible for accepting and rejecting reviews from evaluators.</li>
        <li><b class="role-text-owner">Owner:</b> Everything in the "Manage" level. Can also delete the Collection and create new Owner Grants. Responsible for accepting and rejecting reviews from evaluators.</li>
      </ul>
      <br>
      * By default, Users with a Restricted grant to a Collection can't access any STIG on any Asset. They can be assigned specific STIGs on specific Assets using the "Edit Restriced Access..." button in the Grants panel toolbar.
    </div>
  </Popover>
</template>

<style scoped>
.info-icon {
  width: 1.25rem !important;
  height: 1.25rem !important;
  padding: 0 !important;
}

.role-info-content {
  max-width: 400px;
  line-height: 1.5;
  padding: 0.5rem;
}

ul {
  padding-left: 1.2rem;
  margin: 0.5rem 0;
}

li {
  margin-bottom: 0.25rem;
}

.role-text-restricted {
  color: var(--role-restricted);
}
.role-text-full {
  color: var(--role-full);
}
.role-text-manage {
  color: var(--role-manage);
}
.role-text-owner {
  color: var(--role-owner);
}
</style>
