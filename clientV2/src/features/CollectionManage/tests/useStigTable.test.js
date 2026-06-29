import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useStigTable } from '../composables/useStigTable.js'

describe('useStigTable', () => {
  it('maps STIG metrics into percentage columns', () => {
    const stigs = ref([
      {
        benchmarkId: 'RHEL_8_STIG',
        title: 'Red Hat Enterprise Linux 8',
        assets: 10,
        ruleCount: 50,
        metrics: {
          assessments: 500, // 10 assets * 50 rules
          assessed: 250, // 50%
          statuses: {
            submitted: 50,
            accepted: 100, // submitted + accepted + rejected = 175 (35%)
            rejected: 25,
          },
        },
      },
      {
        benchmarkId: 'EMPTY_STIG',
        // tests fallback mapping for missing data
      }
    ])

    const { tableData } = useStigTable(stigs)

    expect(tableData.value[0]).toMatchObject({
      benchmarkId: 'RHEL_8_STIG',
      title: 'Red Hat Enterprise Linux 8',
      assessedPct: 50,
      submittedPct: 35, // (50 + 100 + 25) / 500 * 100
      acceptedPct: 20, // 100 / 500 * 100
      rejectedPct: 5,  // 25 / 500 * 100
    })

    // Check defaults for missing metrics
    expect(tableData.value[1]).toMatchObject({
      benchmarkId: 'EMPTY_STIG',
      title: '',
      assessedPct: 0,
      submittedPct: 0,
      acceptedPct: 0,
      rejectedPct: 0,
    })
  })

  it('filters data by benchmarkId or title', () => {
    const stigs = ref([
      { benchmarkId: 'WINDOWS_10', title: 'Microsoft Windows 10' },
      { benchmarkId: 'RHEL_8', title: 'Red Hat Enterprise Linux 8' },
    ])
    const { filteredData, stigFilter } = useStigTable(stigs)

    expect(filteredData.value.length).toBe(2)

    stigFilter.value = 'windows'
    expect(filteredData.value[0].benchmarkId).toBe('WINDOWS_10')
    expect(filteredData.value.length).toBe(1)

    stigFilter.value = 'RED HAT' // case insensitive
    expect(filteredData.value[0].benchmarkId).toBe('RHEL_8')
    expect(filteredData.value.length).toBe(1)
  })
})
