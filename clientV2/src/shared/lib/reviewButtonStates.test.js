import { describe, expect, it } from 'vitest'
import { getReviewButtonStates } from './reviewButtonStates.js'

function states(overrides = {}) {
  return {
    accessMode: 'rw',
    statusLabel: '',
    isDirty: false,
    isSubmittable: false,
    canAccept: false,
    ...overrides,
  }
}

describe('getReviewButtonStates', () => {
  describe('read-only mode', () => {
    it('should return all buttons disabled', () => {
      const { save, submit, accept } = getReviewButtonStates(states({ accessMode: 'r' }))
      expect(save.enabled).toBe(false)
      expect(submit.enabled).toBe(false)
      expect(accept.enabled).toBe(false)
    })

    it('should show accept only when canAccept', () => {
      const without = getReviewButtonStates(states({ accessMode: 'r', canAccept: false }))
      expect(without.accept.visible).toBe(false)
      const with_ = getReviewButtonStates(states({ accessMode: 'r', canAccept: true }))
      expect(with_.accept.visible).toBe(true)
    })
  })

  describe('save button', () => {
    it('should show Save enabled when dirty and editable', () => {
      const { save } = getReviewButtonStates(states({ isDirty: true }))
      expect(save.text).toBe('Save')
      expect(save.enabled).toBe(true)
      expect(save.actionType).toBe('save')
    })

    it('should show Save disabled when clean', () => {
      const { save } = getReviewButtonStates(states({ isDirty: false }))
      expect(save.text).toBe('Save')
      expect(save.enabled).toBe(false)
      expect(save.tooltip).toBeTruthy()
    })

    it('should show Unsubmit when submitted', () => {
      const { save } = getReviewButtonStates(states({ statusLabel: 'submitted' }))
      expect(save.text).toBe('Unsubmit')
      expect(save.enabled).toBe(true)
      expect(save.actionType).toBe('unsubmit')
    })

    it('should show Unsubmit when accepted', () => {
      const { save } = getReviewButtonStates(states({ statusLabel: 'accepted' }))
      expect(save.text).toBe('Unsubmit')
      expect(save.enabled).toBe(true)
      expect(save.actionType).toBe('unsubmit')
    })
  })

  describe('submit button', () => {
    it('should always be visible', () => {
      const cases = ['', 'saved', 'submitted', 'accepted', 'rejected']
      for (const statusLabel of cases) {
        const { submit } = getReviewButtonStates(states({ statusLabel }))
        expect(submit.visible).toBe(true)
        expect(submit.text).toBe('Submit')
      }
    })

    it('should be enabled when dirty + submittable', () => {
      const { submit } = getReviewButtonStates(states({ isDirty: true, isSubmittable: true }))
      expect(submit.enabled).toBe(true)
      expect(submit.actionType).toBe('save and submit')
    })

    it('should be enabled when clean + submittable + saved', () => {
      const { submit } = getReviewButtonStates(states({ statusLabel: 'saved', isSubmittable: true }))
      expect(submit.enabled).toBe(true)
      expect(submit.actionType).toBe('submit')
    })

    it('should be disabled when already submitted', () => {
      const { submit } = getReviewButtonStates(states({ statusLabel: 'submitted', isSubmittable: true }))
      expect(submit.enabled).toBe(false)
      expect(submit.tooltip).toContain('already been submitted')
    })

    it('should be disabled when already accepted', () => {
      const { submit } = getReviewButtonStates(states({ statusLabel: 'accepted', isSubmittable: true }))
      expect(submit.enabled).toBe(false)
      expect(submit.tooltip).toContain('already been accepted')
    })

    it('should be disabled when not submittable', () => {
      const { submit } = getReviewButtonStates(states({ isDirty: true, isSubmittable: false }))
      expect(submit.enabled).toBe(false)
      expect(submit.tooltip).toContain('not complete')
    })

    it('should be disabled when clean + rejected + submittable', () => {
      const { submit } = getReviewButtonStates(states({ statusLabel: 'rejected', isSubmittable: true }))
      expect(submit.enabled).toBe(false)
      expect(submit.tooltip).toContain('not been modified')
    })
  })

  describe('accept button', () => {
    it('should be visible only when canAccept', () => {
      const without = getReviewButtonStates(states({ canAccept: false, statusLabel: 'submitted' }))
      expect(without.accept.visible).toBe(false)
      const with_ = getReviewButtonStates(states({ canAccept: true, statusLabel: 'submitted' }))
      expect(with_.accept.visible).toBe(true)
    })

    it('should be enabled when submitted', () => {
      const { accept } = getReviewButtonStates(states({ canAccept: true, statusLabel: 'submitted' }))
      expect(accept.enabled).toBe(true)
      expect(accept.actionType).toBe('accept')
    })

    it('should be disabled when already accepted', () => {
      const { accept } = getReviewButtonStates(states({ canAccept: true, statusLabel: 'accepted' }))
      expect(accept.enabled).toBe(false)
      expect(accept.tooltip).toContain('already been accepted')
    })

    it('should be disabled when not yet submitted', () => {
      const { accept } = getReviewButtonStates(states({ canAccept: true, statusLabel: 'saved' }))
      expect(accept.enabled).toBe(false)
      expect(accept.tooltip).toContain('must be submitted')
    })
  })
})
