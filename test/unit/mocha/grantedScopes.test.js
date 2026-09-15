import { expect } from 'chai'
import auth from '../../../api/source/utils/auth.js'

const { getGrantedScopes } = auth

describe('getGrantedScopes', function () {
  it('parses a space-separated string claim', function () {
    const payload = { scope: 'stig-manager:collection stig-manager:stig:read' }
    expect(getGrantedScopes(payload, ['scope']))
      .to.deep.equal(['stig-manager:collection', 'stig-manager:stig:read'])
  })

  it('uses an array claim as-is', function () {
    const payload = { roles: ['stig-manager:collection', 'stig-manager:user'] }
    expect(getGrantedScopes(payload, ['roles']))
      .to.deep.equal(['stig-manager:collection', 'stig-manager:user'])
  })

  it('returns an empty list when the claim is absent', function () {
    expect(getGrantedScopes({}, ['scope'])).to.deep.equal([])
  })

  it('returns an empty list for a null claim', function () {
    expect(getGrantedScopes({ scope: null }, ['scope'])).to.deep.equal([])
  })

  it('returns an empty list for a numeric claim', function () {
    expect(getGrantedScopes({ scope: 42 }, ['scope'])).to.deep.equal([])
  })

  it('returns an empty list for an object claim', function () {
    expect(getGrantedScopes({ scope: { a: 1 } }, ['scope'])).to.deep.equal([])
  })

  it('returns an empty list for an empty string claim', function () {
    expect(getGrantedScopes({ scope: '' }, ['scope'])).to.deep.equal([])
  })

  it('ignores non-string members of an array claim', function () {
    const payload = { roles: ['stig-manager:collection', 42, null, ''] }
    expect(getGrantedScopes(payload, ['roles']))
      .to.deep.equal(['stig-manager:collection'])
  })

  it('unions values across two claims', function () {
    const payload = { scp: 'stig-manager:collection', roles: ['stig-manager:user'] }
    expect(getGrantedScopes(payload, ['scp', 'roles']))
      .to.deep.equal(['stig-manager:collection', 'stig-manager:user'])
  })

  it('deduplicates values present in both claims', function () {
    const payload = { scp: 'stig-manager:collection', roles: ['stig-manager:collection'] }
    expect(getGrantedScopes(payload, ['scp', 'roles']))
      .to.deep.equal(['stig-manager:collection'])
  })

  it('returns values of the present claim when one is absent', function () {
    const payload = { roles: ['stig-manager:collection'] }
    expect(getGrantedScopes(payload, ['scp', 'roles']))
      .to.deep.equal(['stig-manager:collection'])
  })

  it('returns an empty list when every named claim is absent', function () {
    expect(getGrantedScopes({}, ['scp', 'roles'])).to.deep.equal([])
  })

  it('collapses repeated spaces in a string claim', function () {
    const payload = { scope: 'stig-manager:collection  stig-manager:user' }
    expect(getGrantedScopes(payload, ['scope']))
      .to.deep.equal(['stig-manager:collection', 'stig-manager:user'])
  })

  it('does not throw when claimNames is empty', function () {
    expect(getGrantedScopes({ scope: 'stig-manager' }, [])).to.deep.equal([])
  })
})
