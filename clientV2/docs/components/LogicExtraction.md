# Logic Extraction & State

Keep your components dumb and your logic reusable.

## 1. Async Data: `useAsyncState`
Do not manage loading/error/data states manually for every API call. Use our `useAsyncState` wrapper.

```javascript
import { useAsyncState } from '@/shared/composables/useAsyncState'
import { getMetrics } from '../api/metricsApi'

const { state, isLoading, error, execute } = useAsyncState(
  () => getMetrics(props.collectionId)
)
```

### ❌ What NOT To Do:
*   **Manual handling:**
    ```javascript
    // BAD
    const loading = ref(false)
    const err = ref(null)
    const data = ref(null)

    async function load() {
        loading.value = true
        try {
            data.value = await api.get()
        } catch (e) {
            err.value = e
        } finally {
            loading.value = false
        }
    }
    ```
    This boilerplate is error-prone and verbose.

## 2. Extracting Business Logic
If a component has complex computed logic (e.g., filtering, mapping, statistics), extract it into a composable.

**Example: `useCollectionStats.js`**
```javascript
export function useCollectionStats(metrics) {
    const inventory = computed(() => {
        // complex transformation logic
        return metrics.value?.inventory || []
    })

    return { inventory }
}
```

**Usage in Component:**
```javascript
const { inventory } = useCollectionStats(metrics)
```

### ❌ What NOT To Do:
*   **Megacomponents:** Don't write 500 lines of setup code in your component. If it deals with "Stats Logic", move it to `useStats.js`.
*   **Global Event Bus:** Do not use a global event bus for communication. Use Props/Emits for parent-child, and Pinia stores for global app state.

## 3. Reactivity
Pass `Ref`s or getters to composables, not raw values, if you want them to react to changes.

```javascript
// Good
useCollectionCora(metrics) // metrics is a Ref
```

### ❌ What NOT To Do:
*   **Breaking Reactivity:** Accessing `.value` before passing it to a composable that expects a Ref.
    *   *Bad:* `useHelper(props.id)` (if `useHelper` needs to react to ID changes)
    *   *Good:* `useHelper(toRef(props, 'id'))`
