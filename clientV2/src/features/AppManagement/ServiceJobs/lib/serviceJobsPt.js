// PrimeVue Select styling matching the App Data page's dark dropdowns.
export const selectPt = {
  root: { style: 'background-color: var(--color-background-light); border: 1px solid var(--color-border-default); border-radius: 6px; color: var(--color-text-primary); width: 100%;' },
  label: { style: 'padding: 0.5rem 0.75rem; font-size: 1rem; color: var(--color-text-primary);' },
  overlay: { style: 'background-color: var(--color-background-light) !important; border: 1px solid var(--color-border-default) !important;' },
  option: { style: 'color: var(--color-text-primary); font-size: 1rem; padding: 0.5rem 0.75rem;' },
}

// Vertical divider between DataTable header cells, shared by all three grids.
export const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }

export const splitterPt = {
  gutter: { style: 'background: var(--color-border-dark)' },
  root: { style: 'border: none; background: transparent' },
}

// Numeric interval input: compact, centered, dark field.
export const inputNumberPt = {
  pcInputText: {
    root: { style: 'width: 4.5rem; text-align: center; background-color: var(--color-background-light); color: var(--color-text-primary); border: 1px solid var(--color-border-default); border-radius: 6px; padding: 0.5rem; min-width: 0;' },
  },
}

// Date/time field styled to match the dark Select above.
export const datePickerPt = {
  pcInputText: {
    root: { style: 'width: 100%; background-color: var(--color-background-light); color: var(--color-text-primary); border: 1px solid var(--color-border-default); border-radius: 6px; padding: 0.5rem 0.75rem;' },
  },
  dropdown: { style: 'color: var(--color-text-dim);' },
}
