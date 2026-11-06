import { screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../../testUtils/utils'
import AclRulesTable from '../components/User/AclRulesTable.vue'

function renderTable(props) {
  return renderWithProviders(AclRulesTable, {
    props: { rules: [], totalCount: 0, accessOptions: [], ...props },
  })
}

describe('aclRulesTable', () => {
  it('reports an empty ACL when the rules loaded', () => {
    renderTable()
    expect(screen.getByText('No ACL rules.')).toBeInTheDocument()
  })

  it('does not call a list that failed to load empty', () => {
    renderTable({ loadFailed: true })
    expect(screen.getByText('Rules are unavailable.')).toBeInTheDocument()
    expect(screen.queryByText('No ACL rules.')).not.toBeInTheDocument()
  })
})
