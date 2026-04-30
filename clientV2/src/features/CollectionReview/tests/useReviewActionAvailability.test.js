import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { defaultFieldSettings } from '../../../shared/lib/reviewFormUtils.js'
import { useReviewActionAvailability } from '../composables/useReviewActionAvailability.js'

// A saved review that satisfies defaultFieldSettings (detail required always)
const completeReview = { result: 'pass', detail: 'some detail' }
// A saved review that does NOT satisfy defaultFieldSettings (missing detail)
const incompleteReview = { result: 'pass' }

function setup(rows, fieldSettings = defaultFieldSettings) {
  const { actionStates } = useReviewActionAvailability(ref(rows), ref(fieldSettings))
  return actionStates
}

describe('useReviewActionAvailability', () => {
  describe('empty selection', () => {
    it('returns all false', () => {
      const s = setup([])
      expect(s.value).toEqual({ accept: false, reject: false, submit: false, unsubmit: false, batchEdit: false })
    })
  })

  describe('single row', () => {
    it('unsaved: all false', () => {
      const s = setup([{ status: '' }])
      expect(s.value).toEqual({ accept: false, reject: false, submit: false, unsubmit: false, batchEdit: false })
    })

    it('saved complete: only submit enabled', () => {
      const s = setup([{ status: 'saved', ...completeReview }])
      expect(s.value).toEqual({ accept: false, reject: false, submit: true, unsubmit: false, batchEdit: false })
    })

    it('saved incomplete: all false', () => {
      const s = setup([{ status: 'saved', ...incompleteReview }])
      expect(s.value).toEqual({ accept: false, reject: false, submit: false, unsubmit: false, batchEdit: false })
    })

    it('submitted: accept, reject, unsubmit enabled', () => {
      const s = setup([{ status: 'submitted', ...completeReview }])
      expect(s.value).toEqual({ accept: true, reject: true, submit: false, unsubmit: true, batchEdit: false })
    })

    it('rejected: accept, reject, submit, unsubmit enabled', () => {
      const s = setup([{ status: 'rejected', ...completeReview }])
      expect(s.value).toEqual({ accept: true, reject: true, submit: true, unsubmit: true, batchEdit: false })
    })

    it('accepted: only unsubmit enabled', () => {
      const s = setup([{ status: 'accepted', ...completeReview }])
      expect(s.value).toEqual({ accept: false, reject: false, submit: false, unsubmit: true, batchEdit: false })
    })

    it('accepts status as { label } object', () => {
      const s = setup([{ status: { label: 'submitted' }, ...completeReview }])
      expect(s.value.accept).toBe(true)
      expect(s.value.unsubmit).toBe(true)
    })
  })

  describe('multi-row', () => {
    it('all submitted: accept, reject, unsubmit, batchEdit enabled; submit disabled (none left to submit)', () => {
      const rows = [
        { status: 'submitted', ...completeReview },
        { status: 'submitted', ...completeReview },
      ]
      const s = setup(rows)
      expect(s.value).toEqual({ accept: true, reject: true, submit: false, unsubmit: true, batchEdit: true })
    })

    it('submitted + saved-complete: submit, unsubmit, batchEdit enabled; accept/reject blocked by saved row', () => {
      const rows = [
        { status: 'submitted', ...completeReview },
        { status: 'saved', ...completeReview },
      ]
      const s = setup(rows)
      expect(s.value).toEqual({ accept: false, reject: false, submit: true, unsubmit: true, batchEdit: true })
    })

    it('submitted + rejected: accept, submit, unsubmit, batchEdit enabled; reject blocked by rejected row', () => {
      const rows = [
        { status: 'submitted', ...completeReview },
        { status: 'rejected', ...completeReview },
      ]
      const s = setup(rows)
      expect(s.value).toEqual({ accept: true, reject: false, submit: true, unsubmit: true, batchEdit: true })
    })

    it('submitted + unsaved: only batchEdit enabled', () => {
      const rows = [
        { status: 'submitted', ...completeReview },
        { status: '' },
      ]
      const s = setup(rows)
      expect(s.value).toEqual({ accept: false, reject: false, submit: false, unsubmit: false, batchEdit: true })
    })

    it('submitted + saved-incomplete: unsubmit and batchEdit enabled; accept/reject/submit blocked', () => {
      const rows = [
        { status: 'submitted', ...completeReview },
        { status: 'saved', ...incompleteReview },
      ]
      const s = setup(rows)
      // unsubmit only requires no unsaved rows (savedIncomplete does not block it)
      expect(s.value).toEqual({ accept: false, reject: false, submit: false, unsubmit: true, batchEdit: true })
    })

    it('all accepted: submit and unsubmit enabled; accept/reject disabled', () => {
      const rows = [
        { status: 'accepted', ...completeReview },
        { status: 'accepted', ...completeReview },
      ]
      const s = setup(rows)
      expect(s.value).toEqual({ accept: false, reject: false, submit: true, unsubmit: true, batchEdit: true })
    })

    it('submitted + accepted: accept enabled (accepted < total), reject blocked by accepted row', () => {
      const rows = [
        { status: 'submitted', ...completeReview },
        { status: 'accepted', ...completeReview },
      ]
      const s = setup(rows)
      expect(s.value.accept).toBe(true)
      expect(s.value.reject).toBe(false)
      expect(s.value.unsubmit).toBe(true)
      expect(s.value.batchEdit).toBe(true)
    })

    it('all saved-complete: only submit and batchEdit enabled', () => {
      const rows = [
        { status: 'saved', ...completeReview },
        { status: 'saved', ...completeReview },
      ]
      const s = setup(rows)
      expect(s.value).toEqual({ accept: false, reject: false, submit: true, unsubmit: false, batchEdit: true })
    })

    it('batchEdit requires at least 2 rows', () => {
      expect(setup([{ status: 'saved', ...completeReview }]).value.batchEdit).toBe(false)
      expect(setup([
        { status: 'saved', ...completeReview },
        { status: 'saved', ...completeReview },
      ]).value.batchEdit).toBe(true)
    })
  })

  describe('fieldSettings influence on saved-complete classification', () => {
    it('treats a saved row as incomplete when detail is missing and detail is required', () => {
      const strictSettings = { detail: { enabled: 'always', required: 'always' }, comment: { enabled: 'always', required: 'always' } }
      // row has result and detail but no comment — incomplete under strictSettings
      const rows = [{ status: 'saved', result: 'pass', detail: 'some detail' }]
      const s = setup(rows, strictSettings)
      expect(s.value.submit).toBe(false)
    })

    it('treats a saved row as complete when no fields are required', () => {
      const looseSettings = { detail: { enabled: 'always', required: 'never' }, comment: { enabled: 'always', required: 'never' } }
      const rows = [{ status: 'saved', result: 'pass' }]
      const s = setup(rows, looseSettings)
      expect(s.value.submit).toBe(true)
    })
  })
})
