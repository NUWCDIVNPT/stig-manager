import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { notFoundLocation } from './notFound.js'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/:pathMatch(.*)*', name: 'not-found', component: { template: '<div />' } }],
})

describe('notFoundLocation', () => {
  it('builds the 404 location from the route\'s path, query and hash', () => {
    const route = { path: '/stig-library/NOT_A_STIG/V1R1', query: { ruleId: 'SV-1' }, hash: '#top' }
    expect(notFoundLocation(route)).toEqual({
      name: 'not-found',
      params: { pathMatch: ['stig-library', 'NOT_A_STIG', 'V1R1'] },
      query: { ruleId: 'SV-1' },
      hash: '#top',
    })
  })

  it('resolves back to exactly the URL the user opened', () => {
    const fullPath = '/collection/5/asset/12/stig/RHEL_9/revision/V2R1?labelName=web&ruleId=SV-1#top'
    const opened = router.resolve(fullPath)
    expect(router.resolve(notFoundLocation(opened)).fullPath).toBe(fullPath)
  })
})
