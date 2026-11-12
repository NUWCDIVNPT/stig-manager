import { describe, expect, it } from 'vitest'
import { getReviewFieldTooltipHtml, TOOLTIPS } from './tooltips.js'

describe('getReviewFieldTooltipHtml', () => {
  it('describes an always-enabled, always-required field', () => {
    const html = getReviewFieldTooltipHtml('detail', { enabled: 'always', required: 'always' })
    expect(html).toContain('<b>Detail</b>')
    expect(html).toContain(TOOLTIPS.reviewFields.detail.desc)
    expect(html).toContain('enabled for any result.')
    expect(html).toContain('required to submit a review.')
    expect(html).toContain(TOOLTIPS.reviewFields.detail.ckl)
    expect(html).toContain(TOOLTIPS.reviewFields.detail.xccdf)
  })

  it('describes a findings-only field', () => {
    const html = getReviewFieldTooltipHtml('comment', { enabled: 'findings', required: 'findings' })
    expect(html).toContain('<b>Comment</b>')
    expect(html).toContain('enabled for findings only.')
    expect(html).toContain('required to submit a finding.')
  })

  it('treats an explicit optional setting and a missing setting the same', () => {
    for (const setting of [{ enabled: 'always', required: 'optional' }, undefined]) {
      const html = getReviewFieldTooltipHtml('detail', setting)
      expect(html).toContain('enabled for any result.')
      expect(html).toContain('Content in this field is optional.')
      expect(html).not.toContain('undefined')
    }
  })
})
