// Pure helpers for the Review Aging rule editor: option lists, interval <->
// seconds conversion, target (display vs. PUT) shapes, and rule serialization.
// Kept free of Vue so the behavior can be unit-tested in isolation.

export const TRIGGER_FIELD_OPTIONS = [
  { value: 'ts', label: 'Review timestamp' },
  { value: 'statusTs', label: 'Status timestamp' },
  { value: 'touchTs', label: 'Touch timestamp' },
]

export const INTERVAL_UNIT_OPTIONS = [
  { value: 'days', label: 'days', multiplier: 86400 },
  { value: 'hours', label: 'hours', multiplier: 3600 },
]

export const ACTION_OPTIONS = [
  { value: 'delete', label: 'Delete reviews' },
  { value: 'update', label: 'Update reviews' },
]

export const UPDATE_FIELD_OPTIONS = [
  { value: 'status', label: 'Status' },
  { value: 'result', label: 'Result' },
]

const UPDATE_VALUE_OPTIONS = {
  status: [
    { value: 'saved', label: 'Saved' },
    { value: 'submitted', label: 'Submitted' },
  ],
  result: [
    { value: 'notchecked', label: 'Not Checked' },
    { value: 'informational', label: 'Informational' },
  ],
}

export function updateValueOptions(updateField) {
  return UPDATE_VALUE_OPTIONS[updateField] ?? []
}

// ── Interval conversion ─────────────────────────────────────────────────────

// Convert a number + unit to whole seconds for the triggerInterval payload.
export function intervalToSeconds(value, unit) {
  const multiplier = INTERVAL_UNIT_OPTIONS.find(u => u.value === unit)?.multiplier ?? 86400
  return Math.round(Number(value) * multiplier)
}

// Convert stored seconds back to the modal's number + unit. Prefers whole days,
// falls back to (rounded) hours since the modal only offers those two units.
export function secondsToInterval(seconds) {
  const total = Number(seconds) || 0
  if (total > 0 && total % 86400 === 0) {
    return { value: total / 86400, unit: 'days' }
  }
  return { value: Math.max(1, Math.round(total / 3600)), unit: 'hours' }
}

// ── Target shapes ───────────────────────────────────────────────────────────

// True when the display target represents whole-Collection scope.
export function isCollectionTarget(displayTarget) {
  return !displayTarget || displayTarget.collection === true
}

// Reduce a target to the ID-only shape sent in the PUT payload. Accepts either
// the display-rich GET shape ({ asset: { assetId } }) or an already-flattened
// id-only shape ({ assetId }), so it is safe to run over any rule's target.
// Returns undefined for Collection scope (absence of a target == Collection).
export function targetToPut(target) {
  if (isCollectionTarget(target)) {
    return undefined
  }
  const put = {}
  const assetId = target.asset?.assetId ?? target.assetId
  const labelId = target.label?.labelId ?? target.labelId
  if (assetId) {
    put.assetId = assetId
  }
  if (labelId) {
    put.labelId = labelId
  }
  if (target.benchmarkId) {
    put.benchmarkId = target.benchmarkId
  }
  return Object.keys(put).length ? put : undefined
}

// Human-readable summary of a display target for the rules grid / selected panel.
export function targetDisplayLabel(displayTarget) {
  if (isCollectionTarget(displayTarget)) {
    return 'Collection'
  }
  const parts = []
  if (displayTarget.asset?.name) {
    parts.push(displayTarget.asset.name)
  }
  if (displayTarget.label?.name) {
    parts.push(displayTarget.label.name)
  }
  if (displayTarget.benchmarkId) {
    parts.push(displayTarget.benchmarkId)
  }
  return parts.length ? parts.join(' · ') : 'Collection'
}

// ── Form <-> rule ───────────────────────────────────────────────────────────

export function defaultForm() {
  return {
    title: 'New Rule',
    enabled: true,
    target: null,
    triggerField: 'ts',
    intervalValue: 30,
    intervalUnit: 'days',
    triggerAction: 'update',
    updateField: 'status',
    updateValue: 'saved',
  }
}

// Hydrate the form from an existing rule (GET/display shape) for edit/view mode.
export function ruleToForm(rule) {
  if (!rule) {
    return defaultForm()
  }
  const interval = secondsToInterval(rule.triggerInterval)
  const updateField = rule.updateField ?? 'status'
  return {
    title: rule.title ?? 'New Rule',
    enabled: rule.enabled ?? true,
    target: rule.target ?? null,
    triggerField: rule.triggerField ?? 'ts',
    intervalValue: interval.value,
    intervalUnit: interval.unit,
    triggerAction: rule.triggerAction ?? 'update',
    updateField,
    updateValue: rule.updateValue ?? updateValueOptions(updateField)[0]?.value ?? null,
  }
}

// Serialize the form into a grid rule object. The target is kept in its
// display-rich shape (same as rules loaded from the API); it is reduced to the
// ID-only PUT shape later, in rulesToPutPayload.
export function formToRule(form) {
  const rule = {
    title: form.title?.trim() ? form.title.trim() : null,
    enabled: !!form.enabled,
    triggerField: form.triggerField,
    triggerInterval: intervalToSeconds(form.intervalValue, form.intervalUnit),
    triggerAction: form.triggerAction,
  }
  if (form.triggerAction === 'update') {
    rule.updateField = form.updateField
    rule.updateValue = form.updateValue
  }
  if (!isCollectionTarget(form.target)) {
    rule.target = form.target
  }
  return rule
}

// Prepare the rule array for the API: drop the UI-only client key and reduce
// every rule's target from its display-rich shape to the ID-only PUT shape.
export function rulesToPutPayload(rules) {
  return rules.map(({ _clientId, target, ...rest }) => {
    const put = targetToPut(target)
    return put ? { ...rest, target: put } : rest
  })
}

// ── Grid display helpers ────────────────────────────────────────────────────

export function ruleTargetLabel(rule) {
  return targetDisplayLabel(rule.target)
}

export function ruleActionSummary(rule) {
  if (rule.triggerAction === 'delete') {
    return 'Delete reviews'
  }
  const fieldLabel = UPDATE_FIELD_OPTIONS.find(f => f.value === rule.updateField)?.label ?? rule.updateField
  const valueLabel = updateValueOptions(rule.updateField).find(v => v.value === rule.updateValue)?.label ?? rule.updateValue
  return `Set ${fieldLabel} → ${valueLabel}`
}

export function ruleIntervalLabel(rule) {
  const { value, unit } = secondsToInterval(rule.triggerInterval)
  return `${value} ${value === 1 ? unit.replace(/s$/, '') : unit}`
}

export function ruleTriggerFieldLabel(rule) {
  return TRIGGER_FIELD_OPTIONS.find(f => f.value === rule.triggerField)?.label ?? rule.triggerField
}

// ── Single-column rule-row display ──────────────────────────────────────────

// Row title, falling back to a placeholder for blank/untitled rules.
export function ruleTitle(rule) {
  return rule.title?.trim() ? rule.title : 'Untitled rule'
}

// Largest whole unit the interval divides into, with singular/plural text.
const INTERVAL_UNITS = [
  { secs: 86400, one: 'day', many: 'days' },
  { secs: 3600, one: 'hour', many: 'hours' },
  { secs: 60, one: 'minute', many: 'minutes' },
  { secs: 1, one: 'second', many: 'seconds' },
]

export function formatInterval(seconds) {
  const total = Number(seconds) || 0
  const unit = INTERVAL_UNITS.find(u => total % u.secs === 0) ?? INTERVAL_UNITS[INTERVAL_UNITS.length - 1]
  const value = Math.round(total / unit.secs)
  return `${value} ${value === 1 ? unit.one : unit.many}`
}

// Target display lines (icon + text), in fixed order: collection | asset, label,
// stig. Label lines carry name/color so the row can render the colored chip.
export function ruleTargetLines(rule) {
  const target = rule.target
  if (isCollectionTarget(target)) {
    return [{ type: 'collection', icon: 'pi pi-folder', text: 'Collection' }]
  }
  const lines = []
  if (target.asset?.name) {
    lines.push({ type: 'asset', icon: 'pi pi-server', text: target.asset.name })
  }
  if (target.label?.name) {
    lines.push({ type: 'label', label: { name: target.label.name, color: target.label.color } })
  }
  if (target.benchmarkId) {
    lines.push({ type: 'stig', icon: 'pi pi-shield', text: target.benchmarkId })
  }
  return lines.length ? lines : [{ type: 'collection', icon: 'pi pi-folder', text: 'Collection' }]
}

// Gray action + trigger sentence, e.g. "Set status to Saved when Status timestamp > 7 days".
export function ruleSummary(rule) {
  let action
  if (rule.triggerAction === 'delete') {
    action = 'Delete reviews'
  }
  else if (rule.triggerAction === 'update' && (rule.updateField === 'status' || rule.updateField === 'result')) {
    const valueLabel = updateValueOptions(rule.updateField).find(v => v.value === rule.updateValue)?.label ?? rule.updateValue
    action = `Set ${rule.updateField} to ${valueLabel}`
  }
  else {
    action = 'Update reviews'
  }
  return `${action} when ${ruleTriggerFieldLabel(rule)} > ${formatInterval(rule.triggerInterval)}`
}
