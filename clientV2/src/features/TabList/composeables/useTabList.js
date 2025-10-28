import { markRaw, ref } from 'vue'

// Internal registry of feature components used by tabs.
// Keeping this here makes the composable self-contained and easy to reuse.
import AppInfo from '../../AppInfo/components/AppInfo.vue'
import CollectionManage from '../../CollectionManage/components/CollectionManage.vue'
import CollectionView from '../../CollectionView/components/CollectionView.vue'
import ExportImportManage from '../../ExportImportManage/components/ExportImportManage.vue'
import Home from '../../Home/components/Home.vue'
import ServiceJobs from '../../ServiceJobs/components/ServiceJobs.vue'
import StigLibrary from '../../STIGLibrary/components/StigLibrary.vue'
import StigManage from '../../STIGManage/components/STIGManage.vue'
import UserGroupManage from '../../UserGroupManage/components/UserGroupManage.vue'
import UserManage from '../../UserManage/components/UserManage.vue'

const registry = {
  CollectionManage,
  UsersManage: UserManage,
  UserGroupManage,
  StigManage,
  ServiceJobs,
  AppInfo,
  ExportImportManage,
  StigLibrary,
}

/**
 * One composable to manage tabs end-to-end.
 * - State: tabs[], active
 * - Behavior: open, openFromSelection, setActive, close, closeActive, reset
 * - Resolution: built-in resolver maps NavTree selections to components via internal registry
 */
export function useTabList() {
  const tabs = ref([
    { key: 'home', label: 'Home', component: markRaw(Home), props: {}, closable: false },
  ])
  const active = ref('home')

  function normalizeTab(def) {
    // this throw should go away once we are done with features it should be impossible to reach here
    if (!def || !def.key || !def.component) {
      throw new Error('Invalid tab definition')
    }
    console.log('Normalizing tab', def)
    return {
      key: def.key,
      label: def.label,
      component: markRaw(def.component),
      props: def.props ?? {},
      closable: def.closable !== false,
    }
  }

  function resolveComponentName(sel) {
    const key = sel.key
    console.log(key)
    if (!key) {
      return null
    }
    const isNumeric = /^\d+$/.test(key)
    const Comp = isNumeric ? CollectionView : registry[sel.component]
    if (!Comp) {
      return null
    }
    return {
      key,
      label: sel.label,
      component: Comp,
      props: { payload: sel },
      closable: true,
    }
  }

  function handleTabOpen(sel) {
    console.log(sel)
    const componentData = resolveComponentName(sel)
    console.log(componentData)
    if (!componentData) {
      return
    }
    const existing = tabs.value.find(t => t.key === componentData.key)
    if (!existing) {
      console.log('Adding tab', componentData)
      tabs.value.push(normalizeTab(componentData))
    }
    else if (componentData.key && existing.key !== componentData.key) {
      existing.key = componentData.key
    }
    active.value = componentData.key
  }

  function close(key) {
    const target = key
    const idx = tabs.value.findIndex(t => t.key === key)
    if (idx === -1) {
      return
    }
    if (tabs.value[idx].closable === false) {
      return
    }

    const wasActive = active.value === target
    tabs.value.splice(idx, 1)
    if (wasActive) {
      const next = tabs.value[idx] || tabs.value[idx - 1] || tabs.value[0] || null
      active.value = next ? next.key : null
    }
  }

  return {
    tabs,
    active,
    handleTabOpen,
    close,
  }
}
