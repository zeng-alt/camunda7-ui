import { describe, it, expect } from 'vitest'

import { uid, getDefinitions } from '../bpmn'

describe('uid', () => {
  it('returns a string prefixed with ed_', () => {
    expect(uid()).toMatch(/^ed_/)
  })

  it('generates unique ids across calls', () => {
    expect(uid()).not.toBe(uid())
  })
})

describe('getDefinitions', () => {
  it('walks up the $parent chain to find the definitions', () => {
    const definitions = { $type: 'bpmn:Definitions' }
    const process = { $type: 'bpmn:Process', $parent: definitions }
    const task = { $type: 'bpmn:Task', $parent: process }

    expect(getDefinitions(task)).toBe(definitions)
  })

  it('returns the node itself when it is the definitions', () => {
    const definitions = { $type: 'bpmn:Definitions' }
    expect(getDefinitions(definitions)).toBe(definitions)
  })

  it('returns null when no definitions ancestor exists', () => {
    const task = { $type: 'bpmn:Task', $parent: null }
    expect(getDefinitions(task)).toBeNull()
  })

  it('returns null for empty input', () => {
    expect(getDefinitions(undefined)).toBeNull()
    expect(getDefinitions(null)).toBeNull()
  })
})
