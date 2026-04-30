import { fireEvent, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils.js'

import ReviewEditPopover from '../ReviewEditPopover.vue'

// mock popover to avoid testing the teleport and all the opening up math
vi.mock('primevue/popover', () => ({
  default: {
    name: 'Popover',
    emits: ['hide', 'show'],
    setup(props, { expose, emit }) {
      expose({
        hide: () => emit('hide'),
        show: () => emit('show'),
        toggle: vi.fn(),
        alignOverlay: vi.fn(),
      })
      return {}
    },
    template: `
      <div data-testid="mock-popover">
        <button data-testid="trigger-hide" @click="$emit('hide')">Trigger Hide</button>
        <slot></slot>
      </div>
    `,
  },
}))

vi.mock('primevue/textarea', () => ({
  default: {
    name: 'Textarea',
    props: ['modelValue', 'disabled'],
    emits: ['update:modelValue'],
    template: `
      <textarea 
        data-testid="mock-textarea"
        :value="modelValue" 
        :disabled="disabled"
        @input="$emit('update:modelValue', $event.target.value)"
      ></textarea>
    `,
  },
}))

// dont need to test this here
vi.mock('../ReviewResources/ReviewResources.vue', () => ({
  default: {
    name: 'ReviewResources',
    template: '<div data-testid="mock-review-resources"></div>',
  },
}))

describe('reviewEditPopover.vue', () => {
  const defaultReview = {
    result: 'fail',
    detail: 'Initial detail',
    comment: 'Initial comment',
    status: {
      label: 'saved',
    },
  }

  const defaultProps = {
    selectedRuleId: 'V-123',
    collectionId: 'coll-1',
    assetId: 'asset-1',
    accessMode: 'rw',
    canAccept: true,
    fieldSettings: {
      detail: { required: 'always' },
      comment: { required: 'always' },
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function createWrapper(props = {}) {
    return renderWithProviders(ReviewEditPopover, {
      props: {
        ...defaultProps,
        ...props,
      },
    })
  }

  describe('rendering & Initialization', () => {
    it('populates result, detail, and comment fields from currentReview prop', async () => {
      const { rerender } = createWrapper({ currentReview: null })
      await rerender({ currentReview: defaultReview })
      await flushPromises()

      const failOption = screen.getByText('Open').closest('li')
      expect(failOption).toHaveClass('review-edit-popover__result-item--active')

      const textareas = screen.getAllByTestId('mock-textarea')
      expect(textareas[0]).toHaveValue('Initial detail')
      expect(textareas[1]).toHaveValue('Initial comment')
    })

    it('read-only access disables the inputs', async () => {
      const { rerender } = createWrapper({ currentReview: null, accessMode: 'r' })
      await rerender({ currentReview: defaultReview })
      await flushPromises()

      const failOption = screen.getByText('Open').closest('li')
      expect(failOption).toHaveClass('review-edit-popover__result-item--disabled')

      const textareas = screen.getAllByTestId('mock-textarea')
      expect(textareas[0]).toBeDisabled()
      expect(textareas[1]).toBeDisabled()
    })
  })

  describe('user Interactions & Emits', () => {
    it('selecting a new Result, typing a Detail, and clicking Save emits @save', async () => {
      const { rerender, emitted } = createWrapper({ currentReview: null })
      await rerender({ currentReview: defaultReview })
      await flushPromises()

      // Change result to Pass
      const passOption = screen.getByText('Not a Finding').closest('li')
      await fireEvent.click(passOption)

      // Change detail
      const textareas = screen.getAllByTestId('mock-textarea')
      await fireEvent.update(textareas[0], 'New detail')

      // Click save
      const saveBtn = screen.getByText('Save').closest('button')
      await fireEvent.click(saveBtn)

      expect(emitted().save).toBeTruthy()
      expect(emitted().save[0][0]).toEqual({
        ruleId: 'V-123',
        result: 'pass',
        detail: 'New detail',
        comment: 'Initial comment',
        status: 'saved',
      })
    })

    it('clicking Submit emits @status-action with actionType: submit', async () => {
      const { rerender, emitted } = createWrapper({ currentReview: null })
      await rerender({ currentReview: defaultReview })
      await flushPromises()

      const submitBtn = screen.getByText('Submit').closest('button')
      await fireEvent.click(submitBtn)

      expect(emitted()['status-action']).toBeTruthy()
      expect(emitted()['status-action'][0][0]).toEqual({
        ruleId: 'V-123',
        actionType: 'submit',
      })
    })

    it('disables the Submit button if required fields are cleared', async () => {
      const { rerender } = createWrapper({ currentReview: null })
      await rerender({ currentReview: defaultReview })
      await flushPromises()

      // The button should be enabled initially
      const submitBtn = screen.getByText('Submit').closest('button')
      expect(submitBtn).not.toBeDisabled()

      // Clear the required detail field
      const textareas = screen.getAllByTestId('mock-textarea')
      await fireEvent.update(textareas[0], '')
      await flushPromises()

      // The button should now be disabled
      expect(submitBtn).toBeDisabled()
    })

    it('clicking Undo discards changes and resets form', async () => {
      const { rerender } = createWrapper({ currentReview: null })
      await rerender({ currentReview: defaultReview })
      await flushPromises()

      // Make a change
      const textareas = screen.getAllByTestId('mock-textarea')
      await fireEvent.update(textareas[0], 'Dirty detail')

      // Verify dirty
      expect(textareas[0]).toHaveValue('Dirty detail')

      // Click undo
      const undoBtn = screen.getByRole('button', { name: /undo/i })
      await fireEvent.click(undoBtn)

      // Verify reset
      expect(textareas[0]).toHaveValue('Initial detail')
    })
  })

  describe('unsaved Changes Warning & Dismissal', () => {
    it('shows unsaved warning when triggered, and clears on Undo', async () => {
      const { rerender, getByTestId } = createWrapper({ currentReview: null })
      await rerender({ currentReview: defaultReview })
      await flushPromises()

      // Emit show to bind outside handler
      const popoverMock = getByTestId('mock-popover')
      await fireEvent(popoverMock, new Event('show'))

      // Make dirty
      const textareas = screen.getAllByTestId('mock-textarea')
      await fireEvent.update(textareas[0], 'Dirty detail')

      // Click the trigger-hide button we added to our mock
      const triggerHide = screen.getByTestId('trigger-hide')
      await fireEvent.click(triggerHide)

      // Wait for Vue reactivity
      await new Promise(r => setTimeout(r, 10))

      expect(screen.getByText(/Please/i)).toBeInTheDocument()

      // Click undo
      const undoBtn = screen.getByRole('button', { name: /undo/i })
      await fireEvent.click(undoBtn)

      // Warning should be gone
      expect(screen.queryByText(/Please/i)).not.toBeInTheDocument()
    })
  })

  describe('uI Indicators', () => {

    it('toggling Review Resources expands the section', async () => {
      const { rerender } = createWrapper({ currentReview: null })
      await rerender({ currentReview: defaultReview })
      await flushPromises()

      const toggle = screen.getByText('Review Resources')

      // initially hidden
      expect(screen.queryByTestId('mock-review-resources')).not.toBeInTheDocument()

      await fireEvent.click(toggle)

      // should now be visible
      expect(screen.getByTestId('mock-review-resources')).toBeInTheDocument()
    })
  })
})
