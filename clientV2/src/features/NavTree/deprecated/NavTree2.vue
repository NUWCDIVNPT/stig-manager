<!-- <script setup>
import { ref, onMounted, inject, defineProps, computed, defineEmits, watch } from 'vue'
import Tree from 'primevue/tree'
import { useNavTreeCollections } from '../composeables/useNavTreeCollections'
const selectedData = defineModel('selectedData', { default: {} })
const peekMode = ref(false)
const { nodes, loading } = useNavTreeCollections()
const visible = ref(true)
const expandedKeys = ref({ collections: true })
const selectionKeys = ref({})

function findNodeByKey(key, list) {
  for (const node of list ?? []) {
    if (node.key === key) return node
    if (node.children?.length) {
      const hit = findNodeByKey(key, node.children)
      if (hit) return hit
    }
  }
  return null
}

function logout() {
  console.log('Logout clicked')
}

watch(selectionKeys, (map) => {
  const key = Object.keys(map ?? {}).find((k) => map[k])
  const node = key ? findNodeByKey(key, nodes.value) : null
  selectedData.value = node?.data ?? null
})

onMounted(() => {
  if (nodes.value.length) {
    const firstNode = nodes.value[0]
    selectionKeys.value = { [firstNode.key]: true }
    selectedData.value = firstNode.data
  }
})

function toggle() {
  visible.value = true
  peekMode.value = true
  attachOutsideHandlers()
}

function toggle2() {
  peekMode.value = false
  visible.value = !visible.value
  detachOutsideHandlers()
}

function closePeek() {
  if (!peekMode.value) return
  visible.value = false
  peekMode.value = false
  detachOutsideHandlers()
}

function attachOutsideHandlers() {
  detachOutsideHandlers()
  document.addEventListener('mousedown', onDocClick)
}

function onDocClick(e) {
  const drawerEl = document.getElementById('nav-drawer')
  const tabEl = document.getElementById('nav-tab')
  if (!drawerEl) return
  const clickInsideDrawer = drawerEl.contains(e.target)
  const clickOnTab = tabEl?.contains(e.target)
  if (!clickInsideDrawer && !clickOnTab) closePeek()
}

function removeOutsideHandlers() {
  document.removeEventListener('mousedown', onDocClick)
  removeOutsideHandlers = () => {}
}

function detachOutsideHandlers() {
  removeOutsideHandlers()
}

const drawerStyle = computed(() => ({
  top: '23px',
  bottom: '10px',
  width: '300px',
  backgroundColor: '#3d4245',
}))

const tabStyle = computed(() => ({
  top: '23px',
  bottom: '10px',
  left: '0px',
  width: '22px',
  backgroundColor: '#3d4245',
  cursor: 'pointer',
  position: 'fixed',
}))
</script>
<template>
  <div class="relative">
    <div
      class="fixed left-0 z-[1000] grid place-items-center focus:outline-none transition-[opacity] duration-150"
      :style="{ ...tabStyle, backgroundImage: 'none' }"
      role="button"
      tabindex="0"
      :aria-controls="'nav-drawer'"
      :aria-expanded="String(visible)"
      @click="toggle"
      @keydown.enter.prevent="toggle"
      @keydown.space.prevent="toggle"
    >
      <button
        type="button"
        class="btn-unstyled inline-flex h-6 w-6 items-center justify-center text-zinc-400 hover:text-white active:text-zinc-300 transition-colors"
        :aria-label="visible ? 'Collapse (alt)' : 'Expand (alt)'"
        @click.stop="toggle2"
        @keydown.enter.stop.prevent="toggle2"
        @keydown.space.stop.prevent="toggle2"
      >
        <span
          aria-hidden="true"
          class="block h-[14px] w-[14px] bg-current [-webkit-mask-image:url('/collapse-right.svg')] [-webkit-mask-repeat:no-repeat] [-webkit-mask-position:center] [-webkit-mask-size:contain] [mask-image:url('/collapse-right.svg')] [mask-repeat:no-repeat] [mask-position:center] [mask-size:contain] opacity-80 hover:opacity-100"
        />
      </button>
    </div>

    <transition name="slide">
      <aside
        v-show="visible"
        id="nav-drawer"
        class="fixed left-0 z-[1001] rounded-r-lg border-r border-zinc-800 flex flex-col min-h-0 overflow-hidden"
        :style="{
          ...drawerStyle,
          left: peekMode ? '22px' : '0px',
        }"
        @mouseleave="peekMode && closePeek()"
      >
        <header class="flex items-center px-3 py-2 border-b border-[#3d4245] bg-[#35393b]">
          <h2 class="font-semibold text-xs text-zinc-200">Admin Burke</h2>
          <div class="ml-auto flex items-center gap-2">
            <button type="button" class="btn-unstyled group inline-flex items-center justify-center h-5 w-5" aria-label="LogOut" @click="logout()">
              <span
                aria-hidden="true"
                class="block h-[16px] w-[16px] bg-[url('/logout.svg')] bg-center bg-no-repeat bg-contain opacity-80 filter transition-[opacity,filter,transform] duration-[120ms] ease-linear group-hover:opacity-100 group-hover:brightness-125 group-active:brightness-125 group-active:translate-y-[0.5px]"
              />
            </button>
            <button
              type="button"
              class="btn-unstyled group inline-flex items-center justify-center h-5 w-5"
              aria-label="Close drawer"
              @click="
                () => {
                  visible = false
                  peekMode = false
                  detachOutsideHandlers()
                }
              "
            >
              <span
                aria-hidden="true"
                class="block h-[14px] w-[14px] bg-[url('/collapse-left.svg')] bg-center bg-no-repeat bg-contain opacity-80 filter transition-[opacity,filter,transform] duration-[120ms] ease-linear group-hover:opacity-100 group-hover:brightness-125 group-active:brightness-125 group-active:translate-y-[0.5px]"
              />
            </button>
          </div>
        </header>
        <div class="scroll-host flex-1 min-h-0 overflow-x-auto overflow-y-auto bg-[#1f1f1f] text-zinc-200" :class="peekMode ? 'pl-2' : ''">
          <Tree
            v-model:expanded-keys="expandedKeys"
            v-model:selection-keys="selectionKeys"
            :value="nodes"
            :loading="loading"
            selection-mode="single"
            class="h-full"
            :pt="{
              root: { class: '!p-0 min-w-max' },
              nodeContent: {
                class: [
                  'flex w-full items-center min-w-0',
                  '!p-0 !py-[3px] !gap-0 rounded cursor-pointer',
                  'hover:bg-zinc-800/60',
                  'data-[p-selected=true]:!bg-zinc-700/60',
                ].join(' '),
              },
              nodeToggleButton: {
                class: [
                  'inline-grid place-items-center',
                  '!w-4 !h-4 !p-0 !m-0',
                  '!bg-transparent !border-0 !rounded-none',
                  'focus:!outline-none',
                ].join(' '),
              },
              nodeToggleIcon: { class: '!w-3 !h-3 !text-[#a5a4a4]' },
              nodeChildren: { class: 'text-xs' },
              loadingIcon: { class: 'animate-spin' },
            }"
          >
            <template #default="{ node }">
              <span class="inline-flex items-center min-w-0">
                <span v-if="node.icon" :class="['sm-icon', node.icon]" aria-hidden="true" />
                <span v-else class="sm-icon" aria-hidden="true" />
                <span class="truncate">{{ node.label }}</span>
              </span>
            </template>
          </Tree>
        </div>
      </aside>
    </transition>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition:
    transform 0.18s ease,
    opacity 0.18s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.sm-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 4px;
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
  opacity: 0.9;
  transition:
    opacity 120ms ease,
    filter 120ms ease,
    transform 80ms ease;
}

.sm-collection-icon {
  background-image: url('/collection.svg');
}

.sm-stig-library-icon {
  background-image: url('/library.svg');
}

.sm-app-management-icon {
  background-image: url('/gear.svg');
}

.sm-collection-icon-color {
  background-image: url('/collection-color.svg');
}
</style> -->
