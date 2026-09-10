### 🛠️ Remove collection cards from Home page

1. **Files to edit**:
   - `src/features/Home/views/HomeView.vue`
   - `src/features/Home/views/HomeViewV2.vue` (if separate, otherwise just the main one)

2. **What to remove**:
   - The section displaying collection cards (likely in the second or third row).
   - The `CollectionCard.vue` component import and usage if it's not used elsewhere.

3. **Code context**:
   - The component uses a `collections` array.
   - The HTML template renders `v-for` over `collections`.
   - Look for a `v-row` or `v-col` block containing collection cards.
   - Remove the entire card rendering logic, but keep the "Create Collection" button and the counts section if they should remain.

4. **Optional**:
   - If the cards are not needed, update the layout to better utilize the space (e.g., expand the "Create Collection" section or the stats section).

this was wirrten by an ai not mathew.
