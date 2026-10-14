// Listbox pass-through shared by the dual-list pickers (PickList, GrantsPickList,
// CollectionGrantPickList) so their panes and rows render identically.

const OPTION_STYLE
  = 'padding:0.4rem 0.75rem; font-size:var(--text-md); border-radius:3px; margin-bottom:1px; user-select:none;'
const OPTION_SELECTED_STYLE
  = 'background:color-mix(in srgb, var(--color-action-blue-dark) 18%, transparent); color:var(--color-text-bright);'

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
  option: ({ context }) => ({
    style: context.selected ? `${OPTION_STYLE} ${OPTION_SELECTED_STYLE}` : OPTION_STYLE,
  }),
}
