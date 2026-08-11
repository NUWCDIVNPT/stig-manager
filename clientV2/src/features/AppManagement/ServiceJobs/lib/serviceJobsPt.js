import { compactTablePt } from '../../../../shared/lib/dataTablePt.js'

// Dense report-style table styling shared by the jobs, runs, and output grids.
export function jobsTablePt(options) {
  return compactTablePt({ ...options, headerPadding: '0.3rem 0.6rem' })
}

// PrimeVue Select styling matching the App Data page's dark dropdowns.
export const selectPt = {
  root: { style: 'background-color: var(--color-background-light); border: 1px solid var(--color-border-default); border-radius: 6px; color: var(--color-text-primary); width: 100%;' },
  label: { style: 'padding: 0.5rem 0.75rem; font-size: 1rem; color: var(--color-text-primary);' },
  overlay: { style: 'background-color: var(--color-background-light) !important; border: 1px solid var(--color-border-default) !important;' },
  option: { style: 'color: var(--color-text-primary); font-size: 1rem; padding: 0.5rem 0.75rem;' },
}

export const splitterPt = {
  gutter: { style: 'background: var(--color-border-dark)' },
  root: { style: 'border: none; background: transparent' },
}
