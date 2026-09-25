import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import HighlightText from '../HighlightText.vue'

describe('highlightText.vue', () => {
  it('renders the text as-is without a term', () => {
    const { container } = render(HighlightText, { props: { text: 'host-01 <b>', term: '' } })
    expect(container.textContent).toBe('host-01 <b>')
    expect(container.querySelector('mark')).toBeNull()
    expect(container.querySelector('.cell--match')).toBeNull()
  })

  it('wraps each case-insensitive match in a mark and flags the cell', () => {
    const { container } = render(HighlightText, { props: { text: 'Web-01 web', term: ' WEB ' } })
    expect([...container.querySelectorAll('mark.search-highlight')].map(m => m.textContent)).toEqual(['Web', 'web'])
    expect(container.querySelector('.cell--match')).not.toBeNull()
    expect(container.textContent).toBe('Web-01 web')
  })

  it('leaves unmatched text unflagged', () => {
    const { container } = render(HighlightText, { props: { text: 'db-01', term: 'web' } })
    expect(container.querySelector('mark')).toBeNull()
    expect(container.querySelector('.cell--match')).toBeNull()
  })

  it('escapes markup in the text and accepts numbers', () => {
    const { container } = render(HighlightText, { props: { text: '<img src=x>', term: 'img' } })
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toBe('<img src=x>')

    const num = render(HighlightText, { props: { text: 4711, term: '71' } })
    expect(num.container.querySelector('mark').textContent).toBe('71')
  })
})
