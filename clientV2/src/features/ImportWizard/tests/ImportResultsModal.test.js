import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { renderWithProviders } from '../../../testUtils/utils'
import ImportResultsModal from '../components/ImportResultsModal.vue'

const wizard = {
  step: ref('fileQueue'),
  executor: {
    importIsDone: ref(false),
    importCancelled: ref(false),
    importProgressText: ref(''),
    importStatusRows: ref([]),
    selectedStatusRow: ref(null),
    cancel: vi.fn(),
  },
  parser: { parseResults: ref({ taskAssets: new Map([['a', {}], ['b', {}]]), errors: [], dupedRows: [], hasDuplicates: false }) },
}

vi.mock('../composables/useImportWizard.js', () => ({
  useImportWizard: () => ({
    open: vi.fn(),
    step: wizard.step,
    awaitingParseConfirmation: ref(false),
    collection: { collectionError: ref(null), showCustomizeCb: ref(false), allowCustom: ref(false) },
    options: { importOptions: ref(null), isCustomizing: ref(false), statusOptions: ref([]) },
    queue: { sourceFiles: ref([]), selectedQueueRows: ref([]), isDragOver: ref(false), isAdding: ref(false), canContinue: ref(false), queueNote: ref('') },
    parser: wizard.parser,
    executor: wizard.executor,
    advanceFromFileQueue: vi.fn(),
    confirmAndStartParsing: vi.fn(),
    advanceFromErrors: vi.fn(),
    startImport: vi.fn(),
  }),
}))

const store = { startBackground: vi.fn(), dismiss: vi.fn() }
vi.mock('../../../shared/stores/importProgressStore.js', () => ({
  useImportProgressStore: () => store,
}))

function renderModal(visible) {
  return renderWithProviders(ImportResultsModal, { props: { visible, collectionId: '1' } })
}

describe('importResultsModal unmount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    wizard.step.value = 'fileQueue'
    wizard.executor.importIsDone.value = false
    wizard.executor.importCancelled.value = false
  })

  it('hands a visible, in-flight import to the background store', () => {
    wizard.step.value = 'importProgress'
    const { unmount } = renderModal(true)

    unmount()

    expect(store.startBackground).toHaveBeenCalledWith({ totalCount: 2, executor: wizard.executor })
    expect(wizard.executor.cancel).not.toHaveBeenCalled()
  })

  it('does nothing when the import is already minimized', () => {
    wizard.step.value = 'importProgress'
    const { unmount } = renderModal(false)

    unmount()

    expect(store.startBackground).not.toHaveBeenCalled()
  })

  it('does nothing when no import is running', () => {
    wizard.step.value = 'preview'
    const { unmount } = renderModal(true)

    unmount()

    expect(store.startBackground).not.toHaveBeenCalled()
  })
})
