// PrimeVue pass-through configs for form fields and tab layouts, shared by the
// App Management detail panels and create modals so they render identically.

export const inputTextPt = {
  root: { style: 'background: var(--color-background-light); color: var(--color-text-primary); border-color: var(--color-border-default); font-size: 1rem; padding: 0.6rem 0.8rem; width: 100%;' },
}

export const tabsPt = {
  root: { style: 'flex: 1; min-height: 0; display: flex; flex-direction: column;' },
}

export const tabListPt = {
  root: { style: 'background: transparent; border-bottom: 1px solid var(--color-border-default); gap: 0.25rem;' },
  activeBar: { style: 'height: 3px; background-color: var(--color-primary-highlight); bottom: -1px;' },
  content: { style: 'border: none;' },
}

export const tabPt = {
  root: ({ context }) => ({
    style: {
      padding: '0.6rem 1.1rem',
      fontSize: '0.95rem',
      fontWeight: context.active ? '700' : '600',
      color: context.active ? 'var(--color-text-bright)' : 'var(--color-text-dim)',
      background: 'transparent',
      border: 'none',
      transition: 'all 0.2s ease',
    },
  }),
}

export const tabPanelsPt = {
  root: { style: 'flex: 1; min-height: 0; padding: 0.75rem 0 0; background: transparent; display: flex; flex-direction: column;' },
}

export const tabPanelPt = {
  root: { style: 'flex: 1; min-height: 0; height: 100%; display: flex; flex-direction: column;' },
}
