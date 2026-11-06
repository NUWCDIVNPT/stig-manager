import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { useReviewEditForm } from './useReviewEditForm.js'

const fieldSettings = ref({
  detail: { enabled: 'always', required: 'always' },
  comment: { enabled: 'always', required: 'findings' },
})

function setup(row, { isSaving } = {}) {
  const rowData = ref(row)
  const form = useReviewEditForm({
    rowData,
    fieldSettings,
    accessMode: ref('rw'),
    canAccept: ref(false),
    isSaving,
  })
  return { rowData, form }
}

const asset1 = { assetId: '1', ruleId: 'R1', result: 'pass', detail: 'one', comment: '', status: 'saved' }
const asset2 = { assetId: '2', ruleId: 'R1', result: 'fail', detail: 'two', comment: 'c', status: 'saved' }

async function open(rowData, row) {
  rowData.value = row
  await nextTick()
}

describe('useReviewEditForm re-sync', () => {
  it('loads the row when the popover opens on it', async () => {
    const { rowData, form } = setup(null)

    await open(rowData, asset1)

    expect(form.formDetail.value).toBe('one')
    expect(form.isDirty.value).toBe(false)
  })

  it('switches to the new row when the asset changes', async () => {
    const { rowData, form } = setup(null)
    await open(rowData, asset1)
    form.formDetail.value = 'typed'

    await open(rowData, asset2)

    expect(form.formDetail.value).toBe('two')
  })

  it('switches to the new row when the rule changes', async () => {
    const { rowData, form } = setup(null)
    await open(rowData, asset1)

    await open(rowData, { ...asset1, ruleId: 'R2', detail: 'other rule' })

    expect(form.formDetail.value).toBe('other rule')
  })

  it('clears when the row goes away', async () => {
    const { rowData, form } = setup(null)
    await open(rowData, asset1)

    await open(rowData, null)

    expect(form.formDetail.value).toBe('')
  })

  it('keeps edits when the same row is replaced by a new object', async () => {
    const { rowData, form } = setup(null)
    await open(rowData, asset2)
    form.formDetail.value = 'typed'

    await open(rowData, { ...asset2, assetLabels: [] })

    expect(form.formDetail.value).toBe('typed')
    expect(form.isDirty.value).toBe(true)
  })

  it('keeps edits when hydrating a checklist row adds its assetId', async () => {
    const checklistRow = { ruleId: 'R1', result: 'pass', detail: 'one', comment: '', status: 'saved' }
    const { rowData, form } = setup(null)
    await open(rowData, checklistRow)
    form.formDetail.value = 'typed while loading'

    await open(rowData, { ...checklistRow, assetId: 42, username: 'admin' })

    expect(form.formDetail.value).toBe('typed while loading')
    expect(form.isDirty.value).toBe(true)
  })

  it('keeps edits when the row changes on the server', async () => {
    const { rowData, form } = setup(null)
    await open(rowData, asset1)
    form.formComment.value = 'typed'

    await open(rowData, { ...asset1, detail: 'changed elsewhere' })

    expect(form.formComment.value).toBe('typed')
    expect(form.formDetail.value).toBe('one')
  })

  it('takes new values for the same row when nothing was typed', async () => {
    const { rowData, form } = setup(null)
    await open(rowData, asset1)

    await open(rowData, { ...asset1, detail: 'hydrated detail' })

    expect(form.formDetail.value).toBe('hydrated detail')
    expect(form.isDirty.value).toBe(false)
  })

  it('is clean again once a save returns the typed values', async () => {
    const { rowData, form } = setup(null)
    await open(rowData, asset1)
    form.formDetail.value = 'typed'

    await open(rowData, { ...asset1, detail: 'typed' })

    expect(form.isDirty.value).toBe(false)
  })

  it('still discards to the latest row on Undo', async () => {
    const { rowData, form } = setup(null)
    await open(rowData, asset1)
    form.formDetail.value = 'typed'
    await open(rowData, { ...asset1, detail: 'newer' })

    form.discardChanges()

    expect(form.formDetail.value).toBe('newer')
  })
})

describe('useReviewEditForm while saving', () => {
  it('locks editing during a save and unlocks after', async () => {
    const isSaving = ref(false)
    const { rowData, form } = setup(null, { isSaving })
    await open(rowData, asset1)
    expect(form.editable.value).toBe(true)

    isSaving.value = true
    form.selectResult('fail')

    expect(form.editable.value).toBe(false)
    expect(form.formResult.value).toBe('pass')

    isSaving.value = false
    expect(form.editable.value).toBe(true)
  })
})
