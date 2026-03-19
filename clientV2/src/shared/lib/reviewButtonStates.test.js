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
    it('should return both buttons disabled/hidden', () => {
      const { btn1, btn2 } = getReviewButtonStates(states({ accessMode: 'r' }))
      expect(btn1.visible).toBe(false)
      expect(btn1.enabled).toBe(false)
      expect(btn2.text).toBe('Read only')
      expect(btn2.enabled).toBe(false)
    })
  })

  describe('editable + dirty + submittable', () => {
    it('should show Save and Submit both enabled', () => {
      const { btn1, btn2 } = getReviewButtonStates(states({
        isDirty: true,
        isSubmittable: true,
      }))
      expect(btn1.text).toBe('Save')
      expect(btn1.enabled).toBe(true)
      expect(btn1.actionType).toBe('save')
      expect(btn2.text).toBe('Submit')
      expect(btn2.enabled).toBe(true)
      expect(btn2.actionType).toBe('save and submit')
    })
  })

  describe('editable + dirty + not submittable', () => {
    it('should show Save enabled, Save and Submit disabled', () => {
      const { btn1, btn2 } = getReviewButtonStates(states({
        isDirty: true,
        isSubmittable: false,
      }))
      expect(btn1.text).toBe('Save')
      expect(btn1.enabled).toBe(true)
      expect(btn1.actionType).toBe('save and unsubmit')
      expect(btn2.text).toBe('Save and Submit')
      expect(btn2.enabled).toBe(false)
    })
  })

  describe('editable + clean + submittable + saved', () => {
    it('should show Save disabled, Submit enabled', () => {
      const { btn1, btn2 } = getReviewButtonStates(states({
        statusLabel: 'saved',
        isSubmittable: true,
      }))
      expect(btn1.text).toBe('Save')
      expect(btn1.enabled).toBe(false)
      expect(btn2.text).toBe('Submit')
      expect(btn2.enabled).toBe(true)
      expect(btn2.actionType).toBe('submit')
    })
  })

  describe('editable + clean + submittable + rejected', () => {
    it('should show Save and Resubmit both disabled', () => {
      const { btn1, btn2 } = getReviewButtonStates(states({
        statusLabel: 'rejected',
        isSubmittable: true,
      }))
      expect(btn1.text).toBe('Save')
      expect(btn1.enabled).toBe(false)
      expect(btn2.text).toBe('Resubmit')
      expect(btn2.enabled).toBe(false)
    })
  })

  describe('editable + clean + not submittable', () => {
    it('should show both buttons disabled', () => {
      const { btn1, btn2 } = getReviewButtonStates(states({
        statusLabel: 'saved',
        isSubmittable: false,
      }))
      expect(btn1.enabled).toBe(false)
      expect(btn2.enabled).toBe(false)
    })
  })

  describe('submitted + submittable + canAccept', () => {
    it('should show Unsubmit and Accept both enabled', () => {
      const { btn1, btn2 } = getReviewButtonStates(states({
        statusLabel: 'submitted',
        isSubmittable: true,
        canAccept: true,
      }))
      expect(btn1.text).toBe('Unsubmit')
      expect(btn1.enabled).toBe(true)
      expect(btn1.actionType).toBe('unsubmit')
      expect(btn2.text).toBe('Accept')
      expect(btn2.enabled).toBe(true)
      expect(btn2.actionType).toBe('accept')
    })
  })

  describe('submitted + submittable + !canAccept', () => {
    it('should show Unsubmit enabled, Submit disabled', () => {
      const { btn1, btn2 } = getReviewButtonStates(states({
        statusLabel: 'submitted',
        isSubmittable: true,
        canAccept: false,
      }))
      expect(btn1.text).toBe('Unsubmit')
      expect(btn1.enabled).toBe(true)
      expect(btn2.text).toBe('Submit')
      expect(btn2.enabled).toBe(false)
    })
  })

  describe('accepted + submittable', () => {
    it('should show Unsubmit enabled, Accept disabled', () => {
      const { btn1, btn2 } = getReviewButtonStates(states({
        statusLabel: 'accepted',
        isSubmittable: true,
      }))
      expect(btn1.text).toBe('Unsubmit')
      expect(btn1.enabled).toBe(true)
      expect(btn2.text).toBe('Accept')
      expect(btn2.enabled).toBe(false)
    })
  })

  describe('submitted + not submittable', () => {
    it('should show Unsubmit enabled, Save and Submit disabled', () => {
      const { btn1, btn2 } = getReviewButtonStates(states({
        statusLabel: 'submitted',
        isSubmittable: false,
      }))
      expect(btn1.text).toBe('Unsubmit')
      expect(btn1.enabled).toBe(true)
      expect(btn2.text).toBe('Save and Submit')
      expect(btn2.enabled).toBe(false)
    })
  })

  describe('rejected + dirty + submittable', () => {
    it('should show Save and Resubmit both enabled', () => {
      const { btn1, btn2 } = getReviewButtonStates(states({
        statusLabel: 'rejected',
        isDirty: true,
        isSubmittable: true,
      }))
      expect(btn1.text).toBe('Save')
      expect(btn1.enabled).toBe(true)
      expect(btn2.text).toBe('Resubmit')
      expect(btn2.enabled).toBe(true)
    })
  })
})
