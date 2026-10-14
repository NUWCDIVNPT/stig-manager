import { rowHeightPx } from './rowHeights.js'

// PrimeVue Listbox pass-through shared by the dual-list pickers (PickList,
// GrantsPickList, CollectionGrantPickList) so their panes and rows render
// identically. The option padding here and the row height in
// pickListVirtualScrollerOptions are a pair: rows are pinned to itemSize, so
// change them together.

const OPTION_STYLE
  = 'padding:0.4rem 0.75rem; font-size:var(--text-md); border-radius:3px; margin-bottom:1px; user-select:none;'
const OPTION_SELECTED_STYLE
  = 'background:color-mix(in srgb, var(--color-action-blue-dark) 18%, transparent); color:var(--color-text-bright);'

const OPTION_PT = { style: OPTION_STYLE }
const OPTION_SELECTED_PT = { style: `${OPTION_STYLE} ${OPTION_SELECTED_STYLE}` }

export const pickListListboxPt = {
  root: {
    style: 'flex:1 1 auto; min-height:0; display:flex; flex-direction:column; border:none; background:transparent;',
  },
  listContainer: {
    style: 'flex:1 1 auto; min-height:0; height:100%; max-height:none; overflow:auto;',
  },
  virtualScroller: {
    root: {
      style: 'flex:1 1 auto; min-height:0; height:100%; max-height:none;',
    },
  },
  // Under a virtual scroller the list is its absolutely positioned content
  // (min-width:100% only), so nowrap rows would widen it past the pane
  // instead of ellipsizing.
  list: {
    style: 'width:100%;',
  },
  option: ({ context }) => (context.selected ? OPTION_SELECTED_PT : OPTION_PT),
}

// Virtual scroller options for the one-line rows styled by pickListListboxPt.
// Call at component setup (see rowHeightPx).
export function pickListVirtualScrollerOptions() {
  return { itemSize: rowHeightPx('compact') }
}
