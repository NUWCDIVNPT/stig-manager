export const importDialogPt = {
  root: { style: 'background-color: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 6px; color: var(--color-text-primary); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06); display: flex; flex-direction: column; overflow: hidden;' },
  header: { style: 'background-color: var(--color-background-dark); color: var(--color-text-primary); border-top-left-radius: 6px; border-top-right-radius: 6px; padding: 1rem; border-bottom: 1px solid var(--color-background-light); flex-shrink: 0;' },
  content: { style: 'background-color: var(--color-background-dark); color: var(--color-text-primary); padding: 1.5rem; flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column;' },
  footer: { style: 'flex-shrink: 0;' },
  closeButton: { style: 'color: var(--color-text-dim);' },
  title: { style: 'font-size: var(--text-xl); font-weight: 600;' },
}

// Framed dialog: the modal renders its own #header slot (icon, title, subtitle),
// so the PrimeVue header carries only the close button and a right inset that
// keeps it off the frame edge. Content clips; use frameDialogScrollPt when the
// body should scroll instead.
export const frameDialogPt = {
  root: { style: 'background: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 8px; color: var(--color-text-primary); display: flex; flex-direction: column; overflow: hidden;' },
  header: { style: 'background: var(--color-background-dark); padding: 0 0.75rem 0 0; border-bottom: 1px solid var(--color-border-default); flex-shrink: 0;' },
  content: { style: 'background: var(--color-background-dark); padding: 0; flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column;' },
  footer: { style: 'flex-shrink: 0; padding: 0; border: none;' },
  closeButton: { style: 'color: var(--color-text-dim);' },
}

export const frameDialogScrollPt = {
  ...frameDialogPt,
  content: { style: 'background: var(--color-background-dark); padding: 0; flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column;' },
}

export const primaryBtnPt = {
  root: ({ context }) => ({
    style: `border: 1px solid ${context.disabled ? 'var(--color-border-default)' : 'var(--color-action-blue-dark)'}; padding: 0.5rem 1.5rem; border-radius: 6px; display: flex; align-items: center; gap: 0.5rem;`,
  }),
}

export const secondaryBtnPt = {
  root: { style: 'padding: 0.5rem 1.25rem; border-radius: 6px; border: 1px solid var(--color-border-default); background: transparent; color: var(--color-text-primary); display: flex; align-items: center; gap: 0.5rem;' },
}

export const dangerBtnPt = {
  root: ({ context }) => ({
    style: `border: 1px solid ${context.disabled ? 'var(--color-border-default)' : 'var(--color-action-red)'}; padding: 0.5rem 1.5rem; border-radius: 6px; display: flex; align-items: center; gap: 0.5rem;`,
  }),
}
