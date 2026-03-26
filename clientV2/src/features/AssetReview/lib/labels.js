import { computed } from 'vue'

export function getContrastColor(hexColor) {
  if (!hexColor) {
    return '#ffffff'
  }
  const hex = hexColor.replace('#', '')
  const r = Number.parseInt(hex.substr(0, 2), 16)
  const g = Number.parseInt(hex.substr(2, 2), 16)
  const b = Number.parseInt(hex.substr(4, 2), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? '#1a1a1a' : '#ffffff'
}

export function useResolvedLabels(asset, collectionLabels) {
  return computed(() => {
    if (!asset.value?.labelIds?.length || !collectionLabels.value?.length) {
      return []
    }
    const labelMap = new Map(collectionLabels.value.map(l => [l.labelId, l]))
    return asset.value.labelIds
      .map(id => labelMap.get(id))
      .filter(Boolean)
      .map(label => ({
        ...label,
        bgColor: label.color ? `#${label.color}` : '#3b82f6',
        textColor: getContrastColor(label.color),
      }))
  })
}
