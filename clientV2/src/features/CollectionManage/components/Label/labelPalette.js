export const LABEL_COLOR_PALETTE = [
  '4568F2',
  '7000FF',
  'E46300',
  '8A5000',
  '019900',
  'DF584B',
  '99CCFF',
  'D1ADFF',
  'FFC399',
  'FFF699',
  'A3EA8F',
  'F5A3A3',
]

export const DEFAULT_LABEL_COLOR = '99CCFF'

export function validateLabelName(name, labels, currentLabelId = null) {
  const value = name?.trim()
  if (!value) {
    return 'Blank values not allowed'
  }
  if (value.length > 16) {
    return 'Label names must be 16 characters or less'
  }

  const duplicate = labels.find(label =>
    label.labelId !== currentLabelId
    && label.name?.toLowerCase() === value.toLowerCase(),
  )

  return duplicate ? 'Duplicate names not allowed' : true
}
