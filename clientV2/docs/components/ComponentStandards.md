# Component Development Standards

We strive for modern, type-safe, and styling-consistent Vue components.

## 1. Syntax: `<script setup>`
Use the `<script setup>` syntax for concise and performant components.

```vue
<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  title: String
})
</script>
```

### ❌ What NOT To Do:
*   **Options API:** Avoid `export default { data() { ... } }` unless strictly necessary for legacy reasons.
*   **Mixing:** Do not mix `<script setup>` and normal `<script>` blocks unless defining Component entry options (like `name` or `inheritAttrs`).

## 2. Props & Emits
Always define consistent types for props and explicit names for emits.

```javascript
const props = defineProps({
  collectionId: {
    type: String,
    required: true
  },
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'submit'])
```

### ❌ What NOT To Do:
*   **Untyped Props:** `defineProps(['id', 'name'])` is sloppy. Always define the type object.
*   **Mutating Props:** Never mutate a prop directly. If you need a local mutable version, use `ref` or `computed`.
    *   *Bad:* `props.visible = false`
    *   *Good:* `emit('update:visible', false)`

## 3. Styling: PrimeVue Passthrough (PT) & Scoped CSS
We use PrimeVue `pt` props to style the internals of complex components (like Dialogs, Tables, Panels) to match our dark theme, and standard scoped CSS for layout.

```javascript
// Example PT object for a Dialog
const dialogPt = {
    root: { style: 'background-color: #18181b; border: 1px solid #3f3f46;' },
    header: { style: 'background-color: #18181b;' }
}
```

```vue
<template>
  <Dialog :pt="dialogPt" ... />
</template>
```

### ❌ What NOT To Do:
*   **Deep Selectors:** Avoid `::v-deep` or `>>>` to hack external component styles. It is brittle and breaks easily with library updates. Use the exposed `pt` API instead.
*   **Global Styles:** Never write styles without `scoped` in a component file.

## 4. Dialogs & v-model
For modal components, use a computed property with a getter/setter to handle the `v-model` cleanly.

```javascript
// Inside MyModal.vue
const props = defineProps({ visible: Boolean })
const emit = defineEmits(['update:visible'])

const isVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})
```

```vue
<template>
  <Dialog v-model:visible="isVisible" ... />
</template>
```

### ❌ What NOT To Do:
*   **Manual Watchers:** Avoid manually watching the prop to update a local ref, and then watching the local ref to emit the event. The computed pattern is cleaner.
