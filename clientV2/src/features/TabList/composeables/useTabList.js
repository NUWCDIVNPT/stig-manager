import { markRaw, ref } from 'vue'
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

const components = {
  CollectionManage,
  UserManage,
  UserGroupManage,
  StigManage,
  ServiceJobs,
  AppInfo,
  ExportImportManage,
  StigLibrary,
  CollectionView,
}

export function useTabList() {
  const tabs = ref([
    { key: 'home', label: 'Home', component: markRaw(Home), props: {}, closable: false },
  ])
  const active = ref('home')

  function resolveComponentName(selectedTab) {
    const key = selectedTab.key
    if (!key) {
      return null
    }
    const Comp = components[selectedTab.component]
    if (!Comp) {
      return null
    }
    return {
      key,
      label: selectedTab.label,
      component: markRaw(Comp),
      props: { payload: selectedTab },
      closable: selectedTab.closable !== false,
    }
  }

  function handleTabOpen(selectedTab) {
    const existingOpenTab = tabs.value.find(t => t.key === selectedTab.key)
    if (existingOpenTab) {
      active.value = existingOpenTab.key
      return
    }
    // if no component found dont open a tab (this is how create collection node doesnt open a tab... )
    const componentData = resolveComponentName(selectedTab)
    if (!componentData) {
      return
    }
    tabs.value.push(componentData)
    active.value = componentData.key
  }

  function handleTabClose(key) {
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
    handleTabClose,
  }
}
