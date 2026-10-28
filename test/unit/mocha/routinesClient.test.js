import { expect } from 'chai'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

// The client files are browser scripts whose decision logic is plain SM functions, so a stub Ext is enough.
// SM.he is Ext.util.Format.htmlEncode (SM/Global.js), copied from Ext 3.4.
const he = value => !value ? value : String(value).replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
const alerts = []
const context = {
  SM: { Library: {}, Routines: {}, he },
  Ext: {
    ns: () => {},
    Msg: { alert: (title, msg) => alerts.push({ title, msg }) },
    extend: () => function () {},
    form: {},
    grid: { GridPanel: function () {} }
  },
  Diff2Html: { html: (patch, config) => ({ patch, config }) }
}
vm.createContext(context)
for (const file of ['diff.js', 'SM/Library.js', 'SM/Routines.js']) {
  vm.runInContext(readFileSync(new URL(`../../../client/src/js/${file}`, import.meta.url), 'utf8'), context)
}
const { renderTextDiff } = context.SM
const { displayState, buttonStates, stateTargets, deleteRefusal, reviewQueueIds, routineButtonMode, matchHolders, createBody, editPatch, ruleName, reapprovalBody, nextStep, renderers, needsReviewText, checkHtml, handleRefusal, settleInBatches } = context.SM.Routines

// Objects built inside the vm carry its Object.prototype, which deep equality rejects.
const plain = value => JSON.parse(JSON.stringify(value))

describe('SM.Routines (client)', function () {
  describe('displayState', function () {
    it('is disabled for a disabled routine, even one that needs review', function () {
      expect(displayState({ state: 'disabled', needsReview: true })).to.equal('disabled')
    })
    it('is needsReview for an active routine the API flagged (stale or approver missing)', function () {
      expect(displayState({ state: 'active', needsReview: true })).to.equal('needsReview')
    })
    it('is needsReview for a routine marked for review', function () {
      expect(displayState({ state: 'needsReview', needsReview: true })).to.equal('needsReview')
    })
    it('is active for an active routine that needs no review', function () {
      expect(displayState({ state: 'active', needsReview: false })).to.equal('active')
    })
  })

  describe('buttonStates', function () {
    const active = { routineId: 'r1', state: 'active', needsReview: false }
    const staleActive = { routineId: 'r2', state: 'active', needsReview: true, stale: true }
    const disabledStale = { routineId: 'r3', state: 'disabled', needsReview: true, stale: true }
    const none = { details: false, enable: false, disable: false, markNeedsReview: false, review: false, delete: false }

    it('offers disable, review and delete for a stale active routine', function () {
      expect(plain(buttonStates([staleActive], true))).to.eql({ ...none, details: true, disable: true, review: true, delete: true })
    })
    it('offers enable and delete, not review, for a disabled stale routine', function () {
      expect(plain(buttonStates([disabledStale], true))).to.eql({ ...none, details: true, enable: true, delete: true })
    })
    it('offers disable, mark needs review and delete for an active routine', function () {
      expect(plain(buttonStates([active], true))).to.eql({ ...none, details: true, disable: true, markNeedsReview: true, delete: true })
    })
    it('offers each state change that applies to at least one of several routines, and delete, but not details', function () {
      expect(plain(buttonStates([active, staleActive], true))).to.eql({ ...none, disable: true, markNeedsReview: true, review: true, delete: true })
    })
    it('offers enable, disable and mark needs review for a mixed selection', function () {
      expect(plain(buttonStates([active, staleActive, disabledStale], true))).to.eql({ ...none, enable: true, disable: true, markNeedsReview: true, review: true, delete: true })
    })
    it('offers enable but not disable when every selected routine is disabled', function () {
      expect(plain(buttonStates([disabledStale, { ...disabledStale, routineId: 'r4' }], true))).to.eql({ ...none, enable: true, delete: true })
    })
    it('withholds delete when any of several selected routines set reviews', function () {
      expect(buttonStates([active, { ...staleActive, reviewCount: 1 }], true).delete).to.equal(false)
    })
    it('offers only details without manage', function () {
      expect(plain(buttonStates([staleActive], false))).to.eql({ ...none, details: true })
    })
    it('offers nothing without a selection', function () {
      expect(plain(buttonStates([], true))).to.eql(none)
    })
    it('withholds delete from a routine that set reviews', function () {
      expect(plain(buttonStates([{ ...active, reviewCount: 2 }], true))).to.eql({ ...none, details: true, disable: true, markNeedsReview: true })
    })
    it('offers delete for a routine that set no reviews', function () {
      expect(buttonStates([{ ...active, reviewCount: 0 }], true).delete).to.equal(true)
    })
  })

  describe('deleteRefusal', function () {
    it('says how many reviews a routine set and to disable it instead', function () {
      expect(deleteRefusal([{ reviewCount: 2 }])).to.equal('Referenced by 2 reviews; disable it instead')
    })
    it('counts a single review in the singular', function () {
      expect(deleteRefusal([{ reviewCount: 1 }])).to.equal('Referenced by 1 review; disable it instead')
    })
    it('is empty for a routine that set no reviews', function () {
      expect(deleteRefusal([{ reviewCount: 0 }])).to.equal('')
    })
    it('is empty without a selection', function () {
      expect(deleteRefusal([])).to.equal('')
    })
    it('counts the reviews of every selected routine', function () {
      expect(deleteRefusal([{ reviewCount: 1 }, { reviewCount: 0 }, { reviewCount: 3 }])).to.equal('Referenced by 4 reviews; disable them instead')
    })
    it('is empty when no selected routine set reviews', function () {
      expect(deleteRefusal([{ reviewCount: 0 }, { reviewCount: 0 }])).to.equal('')
    })
  })

  describe('stateTargets', function () {
    const routines = [
      { routineId: 'active', state: 'active', needsReview: false },
      { routineId: 'stale', state: 'active', needsReview: true, stale: true },
      { routineId: 'marked', state: 'needsReview', needsReview: true },
      { routineId: 'disabled', state: 'disabled', needsReview: true, stale: true }
    ]
    const ids = state => plain(stateTargets(routines, state).map(routine => routine.routineId))

    it('enables only the disabled routines', function () {
      expect(ids('active')).to.eql(['disabled'])
    })
    it('disables every routine not already disabled', function () {
      expect(ids('disabled')).to.eql(['active', 'stale', 'marked'])
    })
    it('marks for review only the active routines', function () {
      expect(ids('needsReview')).to.eql(['active'])
    })
  })

  describe('needsReviewText', function () {
    it('is empty for a routine that needs no review', function () {
      expect(needsReviewText({ needsReview: false, stale: false, state: 'active' })).to.equal('')
    })
    it('covers both causes of staleness for a listed routine, which carries no current checks', function () {
      expect(needsReviewText({ needsReview: true, stale: true, state: 'active' })).to.equal('Check content changed or rule removed')
    })
    it('names the changed check content when a current rule has the STIG ID', function () {
      expect(needsReviewText({ needsReview: true, stale: true, state: 'active', currentChecks: [{ ruleId: 'SV-1r2_rule' }] })).to.equal('Check content changed')
    })
    it('names the removed rule when no current rule has the STIG ID', function () {
      expect(needsReviewText({ needsReview: true, stale: true, state: 'active', currentChecks: [] })).to.equal('No current rule has this STIG ID')
    })
    it('is marked for review for a current routine marked by a Manager', function () {
      expect(needsReviewText({ needsReview: true, stale: false, state: 'needsReview' })).to.equal('Marked for review')
    })
    it('names the missing approver otherwise', function () {
      expect(needsReviewText({ needsReview: true, stale: false, state: 'active' })).to.equal('Approver no longer exists')
    })
  })

  describe('reviewQueueIds', function () {
    it('lists, in order, the routines that show needsReview', function () {
      const records = [
        { routineId: 'r1', state: 'active', needsReview: false },
        { routineId: 'r2', state: 'active', needsReview: true, stale: true },
        { routineId: 'r3', state: 'disabled', needsReview: true, stale: true },
        { routineId: 'r4', state: 'needsReview', needsReview: true }
      ]
      expect(plain(reviewQueueIds(records))).to.eql(['r2', 'r4'])
    })
  })

  describe('routineButtonMode', function () {
    const set = { routine: { routineId: 'r1', name: 'R' } }
    const unset = { routine: null }

    for (const roleId of [3, 4]) {
      it(`is edit for a review set by a routine, with role ${roleId}`, function () {
        expect(routineButtonMode(set, roleId)).to.equal('edit')
      })
      it(`is create for a review no routine set, with role ${roleId}`, function () {
        expect(routineButtonMode(unset, roleId)).to.equal('create')
      })
    }
    it('is details for a review set by a routine, with the Full role', function () {
      expect(routineButtonMode(set, 2)).to.equal('details')
    })
    it('is null for a review no routine set, with the Full role', function () {
      expect(routineButtonMode(unset, 2)).to.equal(null)
    })
    it('is null with the Restricted role', function () {
      expect(routineButtonMode(set, 1)).to.equal(null)
      expect(routineButtonMode(unset, 1)).to.equal(null)
    })
  })

  describe('matchHolders', function () {
    const holder = { routineId: 'r1', name: 'R1', match: { result: 'fail', detail: 'admin, svc_backup', detailTruncated: false } }
    const truncated = { routineId: 'r2', name: 'R2', match: { result: 'fail', detail: 'long', detailTruncated: true } }
    const holders = detail => plain(matchHolders({ result: 'fail', detail }, [holder, truncated])).map(routine => routine.routineId)

    it('finds the routine with the same result and detail', function () {
      expect(holders('admin, svc_backup')).to.eql(['r1'])
    })
    it('trims spaces from the ends of the detail, as the API stores it', function () {
      expect(holders('  admin, svc_backup  ')).to.eql(['r1'])
    })
    it('keeps line breaks at the ends of the detail, which the API keeps', function () {
      expect(holders('admin, svc_backup\n')).to.eql([])
    })
    it('compares the detail byte-exactly, inner whitespace and case included', function () {
      expect(holders('admin,  svc_backup')).to.eql([])
      expect(holders('Admin, svc_backup')).to.eql([])
    })
    it('requires the same result', function () {
      expect(plain(matchHolders({ result: 'pass', detail: 'admin, svc_backup' }, [holder]))).to.eql([])
    })
    it('keeps a truncated routine whose detail begins the shown detail, for its full detail to decide', function () {
      expect(holders('long detail')).to.eql(['r2'])
      expect(holders('other detail')).to.eql([])
    })
  })

  describe('createBody', function () {
    const action = { result: 'pass', comment: null, status: 'submitted' }
    const serverMatch = { result: 'fail', detail: 'line one\r\nline two\n' }
    const shownMatch = { result: 'fail', detail: 'line one\nline two\n' }
    const body = match => plain(createBody({ name: 'n', description: null, ruleId: 'SV-1r1_rule', action, serverMatch, match }))

    it('posts the server match byte-for-byte when the shown match is unedited', function () {
      expect(body(shownMatch)).to.eql({ name: 'n', description: null, ruleId: 'SV-1r1_rule', match: serverMatch, action })
    })
    it('posts the edited detail when it differs', function () {
      const editedMatch = { result: 'fail', detail: 'line one\nline 2\n' }
      expect(body(editedMatch).match).to.eql(editedMatch)
    })
    it('posts the edited result when it differs', function () {
      const editedMatch = { ...shownMatch, result: 'pass' }
      expect(body(editedMatch).match).to.eql(editedMatch)
    })
    it('posts the entered match when the review had none to derive', function () {
      const editedMatch = { result: 'fail', detail: 'entered' }
      expect(plain(createBody({ name: 'n', description: null, ruleId: 'SV-1r1_rule', action, serverMatch: undefined, match: editedMatch })).match).to.eql(editedMatch)
    })
  })

  describe('editPatch', function () {
    const routine = {
      name: 'n',
      description: null,
      match: { result: 'fail', detail: 'a\r\nb' },
      action: { result: 'pass', comment: 'C', status: 'submitted' }
    }
    const unchanged = { name: 'n', description: null, match: { result: 'fail', detail: 'a\nb' }, action: { ...routine.action } }

    it('is empty when nothing changed, including a match shown with textarea line breaks', function () {
      expect(plain(editPatch(routine, unchanged))).to.eql({})
    })
    it('includes name and description when they changed', function () {
      expect(plain(editPatch(routine, { ...unchanged, name: 'm', description: 'd' }))).to.eql({ name: 'm', description: 'd' })
    })
    it('includes the action when any of its properties changed', function () {
      const action = { ...routine.action, status: 'saved' }
      expect(plain(editPatch(routine, { ...unchanged, action }))).to.eql({ action })
    })
    it('includes the match when its detail changed', function () {
      const match = { result: 'fail', detail: 'a\nc' }
      expect(plain(editPatch(routine, { ...unchanged, match }))).to.eql({ match })
    })
    it('includes the match when its result changed', function () {
      const match = { ...unchanged.match, result: 'pass' }
      expect(plain(editPatch(routine, { ...unchanged, match }))).to.eql({ match })
    })
  })

  describe('ruleName', function () {
    it('is the Rule ID without its _rule suffix', function () {
      expect(ruleName('SV-257777r925318_rule')).to.equal('SV-257777r925318')
    })
  })

  describe('reapprovalBody', function () {
    const routine = { routineId: 'r1', name: 'Approved accounts', ruleIds: ['SV-1r1_rule'], checkDigest: 'aa', approvedTs: '2026-10-14T10:00:00Z' }
    const chosenCheck = { ruleId: 'SV-1r2_rule', checkDigest: 'bb', content: 'new text' }

    it("re-approves against the chosen check and the routine's approval on display", function () {
      expect(plain(reapprovalBody(routine, chosenCheck))).to.eql({
        ruleId: 'SV-1r2_rule',
        reviewedCheckDigest: 'bb',
        reviewedApprovedTs: '2026-10-14T10:00:00Z'
      })
    })
    it('takes nothing from another step', function () {
      const otherCheck = { ruleId: 'SV-2r2_rule', checkDigest: 'cc', content: 'other' }
      const otherRoutine = { ...routine, approvedTs: '2026-10-13T09:00:00Z' }
      expect(plain(reapprovalBody(otherRoutine, otherCheck))).to.eql({
        ruleId: 'SV-2r2_rule',
        reviewedCheckDigest: 'cc',
        reviewedApprovedTs: '2026-10-13T09:00:00Z'
      })
    })
    it('renames a routine still named for its rule to the chosen rule', function () {
      expect(plain(reapprovalBody({ ...routine, name: 'SV-1r1' }, chosenCheck))).to.eql({
        ruleId: 'SV-1r2_rule',
        reviewedCheckDigest: 'bb',
        reviewedApprovedTs: '2026-10-14T10:00:00Z',
        name: 'SV-1r2'
      })
    })
    it('keeps a name that only starts like a rule name', function () {
      expect(plain(reapprovalBody({ ...routine, name: 'SV-1r1 admins' }, chosenCheck))).to.not.have.property('name')
    })

    describe('with the second of several current checks chosen in the rule combo', function () {
      const secondCheck = { ruleId: 'SV-2r3_rule', checkDigest: 'dd', content: 'second text' }
      const shown = { ...routine, currentChecks: [chosenCheck, secondCheck] }

      it('re-approves against the second check and renames a routine still named for its rule after it', function () {
        expect(plain(reapprovalBody({ ...shown, name: 'SV-1r1' }, secondCheck))).to.eql({
          ruleId: 'SV-2r3_rule',
          reviewedCheckDigest: 'dd',
          reviewedApprovedTs: '2026-10-14T10:00:00Z',
          name: 'SV-2r3'
        })
      })
      it('re-approves against the second check and keeps any other name', function () {
        expect(plain(reapprovalBody(shown, secondCheck))).to.eql({
          ruleId: 'SV-2r3_rule',
          reviewedCheckDigest: 'dd',
          reviewedApprovedTs: '2026-10-14T10:00:00Z'
        })
      })
    })
  })

  describe('settleInBatches', function () {
    it('settles every request in order, running at most size at once', async function () {
      let running = 0
      let peak = 0
      const request = async item => {
        running++
        peak = Math.max(peak, running)
        await new Promise(resolve => setTimeout(resolve, 1))
        running--
        if (item === 3) throw new Error('refused')
        return item * 10
      }
      const results = await settleInBatches([1, 2, 3, 4, 5], request, 2)
      expect(peak).to.equal(2)
      expect(plain(results.map(result => result.status))).to.eql(['fulfilled', 'fulfilled', 'rejected', 'fulfilled', 'fulfilled'])
      expect(plain(results.filter(result => result.value).map(result => result.value))).to.eql([10, 20, 40, 50])
    })
  })

  describe('nextStep', function () {
    const first = { index: 0, count: 2 }

    for (const action of ['approve', 'disable', 'skip']) {
      it(`advances on ${action}`, function () {
        expect(plain(nextStep(first, action))).to.eql({ index: 1, count: 2 })
      })
    }
    it('stays on reload', function () {
      expect(plain(nextStep(first, 'reload'))).to.eql(first)
    })
    it('stays on reload of the last routine', function () {
      expect(plain(nextStep({ index: 1, count: 2 }, 'reload'))).to.eql({ index: 1, count: 2 })
    })
    it('is done after the last routine', function () {
      expect(nextStep({ index: 1, count: 2 }, 'skip')).to.equal(null)
    })
  })
})

// The global GridView override (overrides.js) HTML-encodes a string cell value before its renderer runs,
// so a renderer gets v encoded once and reads r.data raw.
describe('SM.Routines HTML escaping (client)', function () {
  const hostile = ['<img src=x onerror=alert(1)>', 'say "hi" <b>', 'A & B']
  const qtipPattern = /^<span ext:qtip="([^"<]*)">(.*)<\/span>$/s

  for (const text of hostile) {
    describe(`with ${text}`, function () {
      it('the Name renderer shows the encoded name unchanged, with the raw description encoded for its qtip', function () {
        const [, qtip, shown] = renderers.name(he(text), {}, { data: { description: text } }).match(qtipPattern)
        expect(shown).to.equal(he(text))
        expect(qtip).to.equal(he(he(text)))
      })
      it('the Rule renderer shows the encoded version unchanged and encodes the raw ruleIds', function () {
        expect(renderers.rule(he(text), {}, { data: { ruleIds: [text, 'SV-1r1_rule'] } })).to.equal(`${he(text)}<br>${he(text)}<br>SV-1r1_rule`)
      })
      it('the Match detail renderer shows the encoded detail unchanged', function () {
        expect(renderers.matchDetail(he(text), {}, { data: { matchDetailTruncated: false } })).to.equal(he(text))
        expect(renderers.matchDetail(he(text), {}, { data: { matchDetailTruncated: true } })).to.equal(`${he(text)}…`)
      })
      it('a refusal alert shows the API detail encoded', function () {
        alerts.length = 0
        handleRefusal({ status: 422, responseText: JSON.stringify({ detail: `Routine: ${text}` }) }, 'Save', [422])
        expect(alerts[0].msg).to.equal(he(`Routine: ${text}`))
      })
    })
  }

  it('the Name renderer gives a routine without a description an empty qtip', function () {
    expect(renderers.name('n', {}, { data: { description: null } })).to.equal('<span ext:qtip="">n</span>')
  })
  it('the State qtip text holds no raw quote or angle bracket', function () {
    for (const stale of [true, false]) {
      for (const state of ['active', 'needsReview', 'disabled']) {
        expect(needsReviewText({ needsReview: true, stale, state })).to.not.match(/["<>]/)
      }
    }
  })
})

describe('SM.Routines.checkHtml (client)', function () {
  // A Diff2Html that renders its patch as text, so the html can be inspected.
  let stub
  before(function () {
    stub = context.Diff2Html
    context.Diff2Html = { html: patch => `<diff>${patch}</diff>` }
  })
  after(function () {
    context.Diff2Html = stub
  })
  const routine = { version: 'SRG-OS-000001-GPOS-00001', approvedCheckContent: 'old\ntext' }
  const removed = '<div class="x-grid-empty">No current rule has STIG ID SRG-OS-000001-GPOS-00001. Approve is unavailable; Disable or Skip this routine.</div>'

  it('shows the changes from the approved check text to the current one', function () {
    const html = checkHtml(routine, { ruleId: 'SV-1r2_rule', content: 'new\ntext' })
    expect(html).to.match(/^<diff>/).and.include('-old').and.include('+new')
  })
  it('says when no current rule has the STIG ID, that Approve is unavailable, and shows the approved text as removed', function () {
    const html = checkHtml(routine, undefined)
    expect(html.startsWith(removed)).to.equal(true)
    expect(html).to.include('-old').and.include('-text').and.not.include('+text')
  })
  it('says only that when the approved text is no longer stored either', function () {
    expect(checkHtml({ ...routine, approvedCheckContent: null }, undefined)).to.equal(removed)
  })
  it('shows the current text alone when the approved text is no longer stored', function () {
    expect(checkHtml({ ...routine, approvedCheckContent: null }, { content: 'a < b' })).to.equal(
      '<div class="x-grid-empty">The previously approved check text is no longer stored</div><pre style="white-space:pre-wrap;max-height:100px;overflow:auto">a &lt; b</pre>')
  })
  it('encodes the STIG ID', function () {
    expect(checkHtml({ ...routine, approvedCheckContent: null, version: '<b>' }, undefined)).to.include('STIG ID &lt;b&gt;.')
  })
})

describe('SM.renderTextDiff (client)', function () {
  it('returns the unchanged marker, not a rendered diff, for identical text', function () {
    expect(renderTextDiff('same\ntext', 'same\ntext', { name: 'check', outputFormat: 'side-by-side' })).to.be.a('string').that.includes('unchanged')
  })
  it('renders the whole-text patch with the given output format', function () {
    const { patch, config } = renderTextDiff('old\ntext', 'new\ntext', { name: 'check', outputFormat: 'side-by-side' })
    expect(patch).to.include('--- check').and.include('-old').and.include('+new').and.include(' text')
    expect(plain(config)).to.eql({ drawFileList: false, matching: 'lines', diffStyle: 'word', outputFormat: 'side-by-side' })
  })
})
