import { describe, it, expect, vi } from 'vitest'

import { useBpmnProperties } from '../useBpmnProperties'

describe('useBpmnProperties', () => {
  it('updateProperties delegates to modeling.updateProperties with the raw element', () => {
    const updateProperties = vi.fn()
    const modeler = { get: (name: string) => (name === 'modeling' ? { updateProperties } : null) }
    const element = { id: 'Task_1' }

    const { updateProperties: update } = useBpmnProperties({
      bpmnModeler: modeler,
      element,
      businessObject: element,
    })
    update({ name: '新名称' })

    expect(updateProperties).toHaveBeenCalledWith(element, { name: '新名称' })
  })

  it('updateProperty wraps the value in an attributes object', () => {
    const updateProperties = vi.fn()
    const modeler = { get: (name: string) => (name === 'modeling' ? { updateProperties } : null) }
    const element = { id: 'Task_1' }

    const { updateProperty } = useBpmnProperties({ bpmnModeler: modeler, element })
    updateProperty('name', 'x')

    expect(updateProperties).toHaveBeenCalledWith(element, { name: 'x' })
  })

  it('updateProperties does nothing without a modeling service', () => {
    const element = { id: 'Task_1' }
    const modeler = { get: () => null }
    const { updateProperties } = useBpmnProperties({ bpmnModeler: modeler, element })
    expect(() => updateProperties({ name: 'x' })).not.toThrow()
  })

  it('updateModdleProperties delegates to modeling.updateModdleProperties', () => {
    const updateModdleProperties = vi.fn()
    const modeler = {
      get: (name: string) => (name === 'modeling' ? { updateModdleProperties } : null),
    }
    const element = { id: 'Task_1' }
    const bo = { $type: 'bpmn:Task' }

    const { updateModdleProperties: update } = useBpmnProperties({
      bpmnModeler: modeler,
      element,
      businessObject: bo,
    })
    update({ asyncBefore: true }, bo)

    expect(updateModdleProperties).toHaveBeenCalledWith(element, bo, { asyncBefore: true })
  })

  it('getOrCreateExtensionElements creates extensionElements via moddle', () => {
    const create = vi.fn((type: string, attrs: any) => ({ $type: type, ...attrs }))
    const modeler = { get: (name: string) => (name === 'moddle' ? { create } : null) }
    const bo: any = { $type: 'bpmn:Task' }

    const { getOrCreateExtensionElements } = useBpmnProperties({
      bpmnModeler: modeler,
      businessObject: bo,
    })
    const extensionElements = getOrCreateExtensionElements()

    expect(create).toHaveBeenCalledWith('bpmn:ExtensionElements', { values: [] })
    expect(extensionElements).toBe(bo.extensionElements)
  })

  it('getOrCreateExtensionElements returns null without a moddle service', () => {
    const bo: any = { $type: 'bpmn:Task' }
    const modeler = { get: () => null }
    const { getOrCreateExtensionElements } = useBpmnProperties({
      bpmnModeler: modeler,
      businessObject: bo,
    })
    expect(getOrCreateExtensionElements()).toBeNull()
  })

  it('findExtensionValue finds an extension element by type', () => {
    const listener = { $type: 'camunda:ExecutionListener' }
    const bo: any = { extensionElements: { values: [listener] } }

    const { findExtensionValue } = useBpmnProperties({ bpmnModeler: {}, businessObject: bo })
    expect(findExtensionValue('camunda:ExecutionListener')).toBe(listener)
    expect(findExtensionValue('camunda:Field')).toBeNull()
  })
})
