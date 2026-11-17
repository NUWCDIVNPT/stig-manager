import { beforeEach, describe, expect, it } from 'vitest'
import { forgetCollection, forgetViews, lastQuery, lastViewIn, rememberView } from './lastViews.js'

const tab = (name, collectionId, query = {}) => ({ name, params: { collectionId }, query, meta: { viewGroup: 'collection' } })

describe('lastViews', () => {
  beforeEach(() => forgetViews())

  it('remembers a route\'s own query, without the label filter', () => {
    rememberView(tab('collection-findings', '5', { groupBy: 'rule', finding: 'SV-1', labelName: 'web', labelMatch: 'null' }))

    expect(lastQuery({ name: 'collection-findings', params: { collectionId: '5' } })).toEqual({ groupBy: 'rule', finding: 'SV-1' })
  })

  it('keeps each collection\'s memory apart', () => {
    rememberView(tab('collection-findings', '5', { groupBy: 'rule' }))
    rememberView(tab('collection-findings', '7', { groupBy: 'cci' }))

    expect(lastQuery({ name: 'collection-findings', params: { collectionId: '5' } })).toEqual({ groupBy: 'rule' })
    expect(lastQuery({ name: 'collection-findings', params: { collectionId: '9' } })).toEqual({})
  })

  it('gives the last page seen in a view group', () => {
    rememberView(tab('collection-findings', '5', { finding: 'SV-1' }))
    rememberView(tab('collection-assets', '5', { asset: '12' }))

    expect(lastViewIn('collection', { collectionId: '5' })).toEqual({ name: 'collection-assets', params: { collectionId: '5' }, query: { asset: '12' } })
    expect(lastViewIn('collection', { collectionId: '7' })).toBeNull()
  })

  it('forgets a page that sent its URL to the 404 page', () => {
    rememberView(tab('collection-findings', '5', { finding: 'SV-1' }))
    const bad = tab('collection-assets', '5', { asset: '999' })
    rememberView(bad)
    rememberView({ name: 'not-found', params: {}, query: {}, meta: {} }, bad)

    expect(lastQuery(bad)).toEqual({})
    expect(lastViewIn('collection', { collectionId: '5' })).toBeNull()
    expect(lastQuery({ name: 'collection-findings', params: { collectionId: '5' } })).toEqual({ finding: 'SV-1' })
  })

  it('forgets a deleted collection and keeps the others', () => {
    rememberView(tab('collection-findings', '5', { finding: 'SV-1' }))
    rememberView(tab('collection-findings', '15', { finding: 'SV-2' }))
    forgetCollection('5')

    expect(lastViewIn('collection', { collectionId: '5' })).toBeNull()
    expect(lastQuery({ name: 'collection-findings', params: { collectionId: '5' } })).toEqual({})
    expect(lastQuery({ name: 'collection-findings', params: { collectionId: '15' } })).toEqual({ finding: 'SV-2' })
  })

  it('ignores routes outside a view group and failed navigations', () => {
    rememberView({ name: 'collection-asset-review', params: { collectionId: '5' }, query: { ruleId: 'SV-1' }, meta: {} })
    rememberView(tab('collection-findings', '5', { finding: 'SV-1' }), null, new Error('aborted'))

    expect(lastViewIn('collection', { collectionId: '5' })).toBeNull()
  })
})
