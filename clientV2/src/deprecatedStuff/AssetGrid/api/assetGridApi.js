import { useEnv } from '../../../global-state/useEnv'

function getContrastYIQ(hexcolor) {
  const r = Number.parseInt(hexcolor.substr(0, 2), 16)
  const g = Number.parseInt(hexcolor.substr(2, 2), 16)
  const b = Number.parseInt(hexcolor.substr(4, 2), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? '#080808' : '#f7f7f7'
}

export async function fetchCollectionLabels({ apiUrl = useEnv().apiUrl, collectionId, token }) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch collection labels.')
  }

  const response = await fetch(`${apiUrl}/collections/${collectionId}/labels`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error(`Labels ${response.status} ${response.statusText}`)
  }

  const labels = await response.json()
  const map = new Map()

  for (const label of labels) {
    const bg = `#${label.color}`
    const fg = getContrastYIQ(label.color)
    map.set(label.labelId, {
      id: label.labelId,
      name: label.name,
      bgColor: bg,
      textColor: fg,
    })
  }

  return map
}

export async function fetchCollectionAssetsWithStigs({ apiUrl = useEnv().apiUrl, collectionId, token }) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch collection assets.')
  }

  const response = await fetch(`${apiUrl}/assets?collectionId=${collectionId}&projection=stigs`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error(`Assets ${response.status} ${response.statusText}`)
  }

  return response.json()
}
