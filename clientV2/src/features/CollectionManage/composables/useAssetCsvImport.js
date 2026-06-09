import { AssetParser } from '@nuwcdivnpt/stig-manager-client-modules'
import { computed, ref } from 'vue'
import { apiCall } from '../../../shared/api/apiClient.js'

export function useAssetCsvImport(getCollectionId) {
  const isValidating = ref(false)
  const isSubmitting = ref(false)
  const parsedAssets = ref([])
  const parserErrors = ref({})
  const validAssets = ref([])
  const newLabels = ref([])
  const serverErrors = ref([])

  const groupedParserErrors = computed(() =>
    Object.entries(parserErrors.value).map(([row, messages]) => ({
      row: Number.parseInt(row, 10),
      messages: messages.join('\n'),
    })),
  )

  const allErrors = computed(() => [
    ...groupedParserErrors.value,
    ...serverErrors.value,
  ])

  const errorCount = computed(() => allErrors.value.length)

  const status = computed(() => {
    const hasAssets = validAssets.value.length > 0
    const hasErrors = errorCount.value > 0
    if (isValidating.value) { return { kind: 'parsing', message: 'Parsing Data ....' } }
    if (hasAssets && !hasErrors) { return { kind: 'valid', message: 'All rows valid. Ready to submit.' } }
    if (hasAssets && hasErrors) { return { kind: 'mixed', message: 'Some rows have errors. Valid assets are ready to submit.' } }
    if (!hasAssets && hasErrors) { return { kind: 'invalid', message: 'No valid rows available. Please fix all errors.' } }
    return { kind: 'none', message: 'No assets to submit.' }
  })

  const canSubmit = computed(() =>
    validAssets.value.length > 0 && !isSubmitting.value && !isValidating.value,
  )

  function reset() {
    parsedAssets.value = []
    parserErrors.value = {}
    validAssets.value = []
    newLabels.value = []
    serverErrors.value = []
  }

  async function parseFile(file) {
    const parser = new AssetParser()
    const result = await parser.parse(file)
    parsedAssets.value = result.assets ?? []
    parserErrors.value = result.errors ?? {}
    validAssets.value = []
    newLabels.value = []
    serverErrors.value = []
  }

  async function runDryRun() {
    isValidating.value = true
    try {
      if (parsedAssets.value.length === 0) {
        validAssets.value = []
        newLabels.value = []
        serverErrors.value = []
        return
      }

      const payload = parsedAssets.value.map(({ CSVRow, ...rest }) => rest)
      const response = await apiCall(
        'createAssets',
        { collectionId: getCollectionId(), dryRun: true },
        payload,
      )

      // 204 No Content (success) — apiCall returns null/empty for empty body
      if (response === null || response === '' || (typeof response === 'object' && Object.keys(response ?? {}).length === 0)) {
        validAssets.value = [...parsedAssets.value]
        newLabels.value = []
        serverErrors.value = []
        return
      }

      // 200 dry-run failure — ClientErrorBadAssetPost
      if (response?.error && Array.isArray(response.detail)) {
        const blocking = []
        const labelNames = new Set()

        for (const item of response.detail) {
          if (item?.detail?.labelName) {
            labelNames.add(item.detail.labelName)
            continue
          }
          const lines = [`Data error: ${item.failure}`]
          if (item.detail?.name) { lines.push(`• Asset Affected: ${item.detail.name}`) }
          if (item.detail?.benchmarkId) { lines.push(`• STIG Unknown: ${item.detail.benchmarkId}`) }
          if (item.detail?.benchmarkIdIndex != null) { lines.push(`• STIG Unknown Index: ${item.detail.benchmarkIdIndex}`) }

          let csvRow = null
          if (item.detail?.assetIndex != null) {
            const matched = parsedAssets.value[item.detail.assetIndex]
            if (matched) { csvRow = matched.CSVRow ?? null }
          }
          else if (item.detail?.name) {
            const matched = parsedAssets.value.find(a => a.name === item.detail.name)
            if (matched) { csvRow = matched.CSVRow ?? null }
          }
          blocking.push({ row: csvRow, messages: lines.join('\n') })
        }

        serverErrors.value = blocking
        newLabels.value = [...labelNames].map(name => ({ labelName: name }))

        const blockedRows = new Set(blocking.map(e => e.row).filter(r => r !== null))
        validAssets.value = parsedAssets.value.filter(a => !blockedRows.has(a.CSVRow))
      }
      else {
        validAssets.value = [...parsedAssets.value]
        newLabels.value = []
        serverErrors.value = []
      }
    }
    catch (err) {
      validAssets.value = []
      throw err
    }
    finally {
      isValidating.value = false
    }
  }

  async function submit() {
    if (!canSubmit.value) { return }
    isSubmitting.value = true
    try {
      if (newLabels.value.length > 0) {
        const labelBody = newLabels.value.map(l => ({
          name: l.labelName,
          description: '',
          color: '4568F2',
        }))
        await apiCall('createCollectionLabels', { collectionId: getCollectionId() }, labelBody)
      }

      const assetBody = validAssets.value.map(({ CSVRow, ...rest }) => rest)
      await apiCall('createAssets', { collectionId: getCollectionId() }, assetBody)
    }
    finally {
      isSubmitting.value = false
    }
  }

  return {
    isValidating,
    isSubmitting,
    parsedAssets,
    parserErrors,
    validAssets,
    newLabels,
    serverErrors,
    groupedParserErrors,
    allErrors,
    errorCount,
    status,
    canSubmit,
    reset,
    parseFile,
    runDryRun,
    submit,
  }
}
