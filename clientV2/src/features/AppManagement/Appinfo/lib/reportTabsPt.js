// Shared PrimeVue pass-through config for the report's boxed-tab Tabs/TabList/Tab,
// used by both AppInfo.vue's top-level tabs and CollectionsTab.vue's nested tabs so
// the two don't each carry their own copy of the same styling. Hover styling and the
// active-tab-icon color can't be expressed through :pt (no hover context, and the
// icon lives in the Tab's slot content, not a pt section), so those rules live in
// ../styles/appInfo.css as plain unscoped CSS keyed off the classes/attributes set
// here — that reaches PrimeVue's internally rendered nodes without :deep().
import '../styles/appInfo.css'

export const reportTabsPt = {
  root: { style: 'display: flex; flex-direction: column; height: 100%;' },
}

export const reportTabPanelsPt = {
  root: { style: 'flex: 1; padding: 0.5rem 0 0; overflow: hidden; display: flex; flex-direction: column' },
}

export function reportTabListPt({ compact = false } = {}) {
  return {
    root: { class: compact ? 'report-tablist report-tablist--compact' : 'report-tablist' },
    tabList: { class: 'report-tablist-list' },
  }
}

export function reportTabPt({ compact = false } = {}) {
  return {
    root: ({ context }) => ({
      class: ['report-tab', compact && 'report-tab--compact'],
      style: {
        color: context.active ? 'var(--color-primary-highlight)' : 'var(--color-text-dim)',
        background: context.active
          ? 'var(--color-background-light)'
          : 'color-mix(in srgb, var(--color-background-dark) 40%, transparent)',
        borderColor: 'var(--color-border-default)',
        borderBottomColor: context.active ? 'var(--color-background-light)' : 'var(--color-border-default)',
        fontWeight: context.active ? '700' : '600',
        boxShadow: context.active ? '0 -2px 0 0 var(--color-primary-highlight) inset' : 'none',
      },
    }),
  }
}
