import engineIcon from '../../../assets/bot2.svg'
import overrideIcon from '../../../assets/override2.svg'
import manualIcon from '../../../assets/user.svg'
import { ENGINE_TYPE } from '../../../shared/lib/reviewConstants.js'
import { getEngineDisplay } from './checklistUtils.js'

const ENGINE_META = {
  [ENGINE_TYPE.ENGINE]: { label: 'Engine', image: engineIcon },
  [ENGINE_TYPE.OVERRIDE]: { label: 'Override', image: overrideIcon },
  [ENGINE_TYPE.MANUAL]: { label: 'Manual', image: manualIcon },
}

export function buildEngineOptions(items) {
  const seen = new Set()
  for (const item of items ?? []) {
    const display = getEngineDisplay(item)
    if (display) {
      seen.add(display)
    }
  }
  return Array.from(seen).map(value => ({
    value,
    label: ENGINE_META[value].label,
    image: ENGINE_META[value].image,
  }))
}
