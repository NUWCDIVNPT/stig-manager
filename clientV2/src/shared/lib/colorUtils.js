export function normalizeColor(color, defaultColor = '#cccccc') {
  if (!color) {
    return defaultColor
  }
  return color.startsWith('#') ? color : `#${color}`
}

export function getContrastColor(hexColor, darkColor = '#000000', lightColor = '#ffffff') {
  if (!hexColor) {
    return darkColor
  }

  const hex = hexColor.replace('#', '')

  let r, g, b
  if (hex.length === 3) {
    r = Number.parseInt(hex[0] + hex[0], 16)
    g = Number.parseInt(hex[1] + hex[1], 16)
    b = Number.parseInt(hex[2] + hex[2], 16)
  }
  else if (hex.length === 6) {
    r = Number.parseInt(hex.substr(0, 2), 16)
    g = Number.parseInt(hex.substr(2, 2), 16)
    b = Number.parseInt(hex.substr(4, 2), 16)
  }
  else {
    return darkColor
  }

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? darkColor : lightColor
}
