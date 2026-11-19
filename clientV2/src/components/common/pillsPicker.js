// MultiSelect pass-through for a pills picker: no field chrome, the chip row in the
// #value slot is the trigger. Callers must set `placeholder`: without one MultiSelect
// hides the label (our #value slot) while nothing is selected.
const pillsMultiSelectPt = {
  root: { style: 'display: block; width: 100%; min-width: 0; background: transparent; border: none; box-shadow: none' },
  labelContainer: { style: { display: 'block', minWidth: 0 } },
  label: { style: 'padding: 0; white-space: normal; color: var(--color-text-primary)' },
  dropdown: { style: { display: 'none' } },
  overlay: { style: { width: '250px' } },
  listContainer: { style: { maxHeight: '270px' } },
  list: { style: { padding: '0.25rem' } },
  option: { style: { padding: '0.35rem 0.6rem', fontSize: 'var(--text-md)' } },
  header: { style: { padding: '0.4rem 0.5rem' } },
  pcFilter: { root: { style: { padding: '0.3rem 0.5rem', fontSize: 'var(--text-md)' } } },
}

// The picker's pt. The select-all box shows a dash while only part of the list is
// ticked (a ticked option may be scrolled or filtered out of sight). MultiSelect has
// no indeterminate state for its header checkbox; style.css draws the dash.
export function pillsPickerPt(hasSelection) {
  const isPartial = context => hasSelection && !context.checked
  return {
    ...pillsMultiSelectPt,
    pcHeaderCheckbox: {
      root: ({ context }) => isPartial(context) ? { 'data-sm-indeterminate': 'true' } : {},
      input: ({ context }) => isPartial(context) ? { 'aria-checked': 'mixed' } : {},
    },
  }
}

// Chips shown before folding the rest into "+N"
export const MAX_VISIBLE_PILLS = 4
