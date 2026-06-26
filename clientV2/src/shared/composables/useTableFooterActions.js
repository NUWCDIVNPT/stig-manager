/**
 * Wires a StatusFooter's `action` events to a PrimeVue DataTable.
 *
 * Replaces the `exportCSV()` + `onFooterAction(key)` boilerplate repeated in
 * every table component. Export is handled internally via the DataTable ref;
 * refresh is delegated to the optional `onRefresh` callback.
 *
 * @param {import('vue').Ref} dtRef - Template ref to the DataTable instance.
 * @param {object} [options]
 * @param {() => void} [options.onRefresh] - Called when the refresh action fires.
 * @returns {{ exportCSV: () => void, onFooterAction: (key: string) => void }} Footer action handlers.
 */
export function useTableFooterActions(dtRef, { onRefresh } = {}) {
  function exportCSV() {
    dtRef.value?.exportCSV()
  }

  function onFooterAction(key) {
    if (key === 'refresh') {
      onRefresh?.()
    }
    else if (key === 'export') {
      exportCSV()
    }
  }

  return { exportCSV, onFooterAction }
}
