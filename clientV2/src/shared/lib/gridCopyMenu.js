// Registry for the single app-level GridCopyMenu. The global PrimeVue
// DataTable pass-through (primevueTheme.js) routes every body row's
// contextmenu event here, so no table has to wire the menu itself.

let menu = null

export function registerGridCopyMenu(instance) {
  menu = instance
}

export function unregisterGridCopyMenu(instance) {
  if (menu === instance) {
    menu = null
  }
}

/**
 * @param {MouseEvent} event native contextmenu event from a DataTable body row
 * @param {object} rowData the row's record
 * @param {object} dt the DataTable component instance
 */
export function showGridCopyMenu(event, rowData, dt) {
  menu?.show(event, rowData, dt)
}
