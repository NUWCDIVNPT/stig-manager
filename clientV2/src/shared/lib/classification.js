/**
 * Banner presentation for an API classification code, or null when no banner
 * is shown ('NONE', unknown or missing), matching the legacy client.
 */
const BANNERS = {
  U: { cls: 'unclassified', text: 'UNCLASSIFIED (U)' },
  CUI: { cls: 'cui', text: 'CONTROLLED (CUI)' },
  FOUO: { cls: 'fouo', text: 'CONTROLLED (FOUO)' },
  C: { cls: 'confidential', text: 'CONFIDENTIAL (C)' },
  S: { cls: 'secret', text: 'SECRET (S)' },
  TS: { cls: 'topsecret', text: 'TOP SECRET (TS)' },
  SCI: { cls: 'sci', text: 'TOP SECRET / SCI (TS/SCI)' },
}

export const CLASSIFICATION_CODES = Object.keys(BANNERS)

export function classificationBanner(apiClassification) {
  return BANNERS[apiClassification] ?? null
}
