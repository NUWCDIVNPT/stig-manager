import { describe, expect, it } from 'vitest'
import { navTreeConfig } from '../composeables/navTreeConfig.js'

describe('navTreeConfig', () => {
  it('exports a sections array with expected top-level sections', () => {
    expect(navTreeConfig).toBeDefined()
    expect(Array.isArray(navTreeConfig.sections)).toBe(true)

    const sectionKeys = navTreeConfig.sections.map(s => s.key)
    expect(sectionKeys.sort()).toEqual(['AppManagement', 'Settings', 'Stig'].sort())
  })

  it('each section has required shape and children', () => {
    for (const section of navTreeConfig.sections) {
      expect(section).toHaveProperty('key')
      expect(typeof section.key).toBe('string')
      expect(section).toHaveProperty('label')
      expect(typeof section.label).toBe('string')
      expect(section).toHaveProperty('icon')
      expect(typeof section.icon).toBe('string')
      expect(section).toHaveProperty('children')
      expect(Array.isArray(section.children)).toBe(true)

      for (const child of section.children) {
        expect(child).toHaveProperty('key')
        expect(typeof child.key).toBe('string')
        expect(child).toHaveProperty('label')
        expect(typeof child.label).toBe('string')
        expect(child).toHaveProperty('icon')
        expect(typeof child.icon).toBe('string')
        // In this config all children specify a component
        expect(child).toHaveProperty('component')
        expect(typeof child.component).toBe('string')
      }
    }
  })

  it('has expected children for AppManagement', () => {
    const appMgmt = navTreeConfig.sections.find(s => s.key === 'AppManagement')
    expect(appMgmt).toBeDefined()
    const childrenKeys = appMgmt.children.map(c => c.key).sort()
    const expected = [
      'CollectionManage',
      'UserManage',
      'UserGroupManage',
      'StigManage',
      'ServiceJobs',
      'AppInfo',
      'ExportImportManage',
    ].sort()
    expect(childrenKeys).toEqual(expected)
  })

  it('has expected children for Stig (A-Z groups)', () => {
    const stig = navTreeConfig.sections.find(s => s.key === 'Stig')
    expect(stig).toBeDefined()
    const childrenKeys = stig.children.map(c => c.key).sort()
    expect(childrenKeys).toEqual(['StigAE', 'StigFM', 'StigNV', 'StigWZ'].sort())
  })

  it('has expected children for Settings including What\'s New and Theme Settings', () => {
    const settings = navTreeConfig.sections.find(s => s.key === 'Settings')
    expect(settings).toBeDefined()
    const childrenKeys = settings.children.map(c => c.key).sort()
    expect(childrenKeys).toEqual(['ThemeSettings', 'WhatsNew'].sort())
  })

  it('uses unique keys at section and child levels', () => {
    const sectionKeys = new Set()
    for (const section of navTreeConfig.sections) {
      expect(sectionKeys.has(section.key)).toBe(false)
      sectionKeys.add(section.key)

      const childKeys = new Set()
      for (const child of section.children) {
        expect(childKeys.has(child.key)).toBe(false)
        childKeys.add(child.key)
      }
    }
  })
})
