import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import RuleInfo from '../RuleInfo.vue'

const ruleContent = {
  ruleId: 'SV-1r1_rule',
  version: 'RHEL-09-000001',
  title: 'Audit logs must be protected',
  severity: 'high',
  check: { content: 'Run: ls -l /var/log/audit' },
  fix: { text: 'chmod 0600 the audit logs' },
  detail: { vulnDiscussion: 'Unprotected logs allow tampering' },
  ccis: [{ cci: 'CCI-000162', apAcronym: 'AU-9', control: 'AU-9' }],
}

const marks = container => [...container.querySelectorAll('mark.search-highlight')].map(m => m.textContent)

describe('ruleInfo highlight', () => {
  it('renders without marks when no highlight is given', () => {
    const { container } = render(RuleInfo, { props: { ruleContent } })
    expect(marks(container)).toEqual([])
    expect(container.textContent).toContain('chmod 0600 the audit logs')
  })

  it('marks the term in each field it is given for', () => {
    const { container } = render(RuleInfo, {
      props: { ruleContent, highlight: { check: 'audit', fix: 'chmod', discussion: 'tampering', ccis: '000162', title: 'logs' } },
    })
    expect(marks(container)).toEqual(['logs', 'audit', 'chmod', 'tampering', '000162'])
  })
})
