export const collectionSelectPt = {
  root: ({ props }) => ({
    style: `background-color: ${props?.disabled ? 'var(--color-background-dark)' : 'var(--color-background-light)'}; border: 1px solid var(--color-border-default); border-radius: 6px; color: var(--color-text-primary); width: 100%; transition: border-color 0.15s, box-shadow 0.15s; ${props?.disabled ? 'opacity: 0.45; cursor: not-allowed;' : ''}`,
  }),
  label: ({ props }) => ({
    style: `color: ${props?.disabled ? 'var(--color-text-dim)' : 'var(--color-text-primary)'}; padding: 0.55rem 0.85rem;`,
  }),
  dropdown: {
    style: 'color: var(--color-text-dim); width: 2.5rem; display: flex; align-items: center; justify-content: center;',
  },
  overlay: {
    style: 'background-color: var(--color-background-light) !important; border: 1px solid var(--color-border-default) !important; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;',
  },
  option: ({ context }) => ({
    style: `color: var(--color-text-dim); padding: 0.55rem 0.85rem;  transition: background-color 0.15s ease, color 0.15s ease; cursor: pointer; ${
      context?.selected
        ? ' font-weight: 600;'
        : context?.focused
          ? 'background-color: var(--color-background-subtle) !important; color: var(--color-text-bright);'
          : ''
    }`,
  }),
}

export const collectionInputTextPt = (invalid = false) => {
  const bg = invalid
    ? 'color-mix(in srgb, var(--color-text-error) 15%, var(--color-background-dark))'
    : 'var(--color-background-dark)'
  return {
    root: { style: `background: ${bg}; color: var(--color-text-primary); border-color: var(--color-border-default); font-size: 1rem; padding: 0.6rem 0.8rem; width: 100%; transition: background 0.2s ease;` },
  }
}

export const collectionTextareaPt = {
  root: { style: 'background: var(--color-background-dark); color: var(--color-text-primary); border-color: var(--color-border-default); font-size: 1rem; padding: 0.6rem 0.8rem; width: 100%; resize: none;' },
}

export const collectionDialogPt = {
  root: { style: 'background: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 8px; color: var(--color-text-primary);' },
  header: { style: 'background: var(--color-background-dark); padding: 1.25rem 1.25rem 0.5rem; border-bottom: 1px solid var(--color-border-default);' },
  content: { style: 'background: var(--color-background-dark); padding: 1.25rem;' },
  footer: { style: 'padding: 1rem 1.25rem; border-top: 1px solid var(--color-border-default);' },
}
