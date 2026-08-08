import { afterEach, describe, it, expect } from 'vitest'

import { FORM_TASK_TEMPLATE } from '../formTask'
import {
  templateTypeRegistry,
  registerTemplateType,
  registerTemplateTypes,
  getTypeIcon,
  getElementTypeFromBo,
  getTaskSubType,
  getEventSubType,
} from '../elementType'

/** 构建一个带 get() 的模拟 BPMN businessObject */
function makeBo($type: string, modelerTemplate?: string) {
  return {
    $type,
    get: (key: string) => (key === 'modelerTemplate' ? (modelerTemplate ?? null) : undefined),
  }
}

const originalKeys = Object.keys(templateTypeRegistry)

afterEach(() => {
  for (const key of Object.keys(templateTypeRegistry)) {
    if (!originalKeys.includes(key)) delete templateTypeRegistry[key]
  }
})

describe('getElementTypeFromBo', () => {
  it.each([
    ['bpmn:Process', 'process'],
    ['bpmn:Collaboration', 'collaboration'],
    ['bpmn:AdHocSubProcess', 'ad-hoc-sub-process'],
    ['bpmn:SubProcess', 'sub-process'],
    ['bpmn:Transaction', 'transaction'],
    ['bpmn:StartEvent', 'start-event'],
    ['bpmn:EndEvent', 'end-event'],
    ['bpmn:IntermediateThrowEvent', 'intermediate-throw-event'],
    ['bpmn:IntermediateCatchEvent', 'intermediate-catch-event'],
    ['bpmn:BoundaryEvent', 'boundary-event'],
    ['bpmn:UserTask', 'user-task'],
    ['bpmn:ServiceTask', 'service-task'],
    ['bpmn:SendTask', 'send-task'],
    ['bpmn:ReceiveTask', 'receive-task'],
    ['bpmn:ManualTask', 'manual-task'],
    ['bpmn:ScriptTask', 'script-task'],
    ['bpmn:BusinessRuleTask', 'business-rule-task'],
    ['bpmn:CallActivity', 'call-activity'],
    ['bpmn:Task', 'task'],
    ['bpmn:ExclusiveGateway', 'exclusive-gateway'],
    ['bpmn:ParallelGateway', 'parallel-gateway'],
    ['bpmn:InclusiveGateway', 'inclusive-gateway'],
    ['bpmn:EventBasedGateway', 'event-based-gateway'],
    ['bpmn:SequenceFlow', 'sequence-flow'],
    ['bpmn:Participant', 'participant'],
    ['bpmn:Lane', 'lane'],
    ['bpmn:TextAnnotation', 'text-annotation'],
    ['bpmn:Group', 'group'],
    ['bpmn:Association', 'association'],
    ['bpmn:DataObjectReference', 'data-object-reference'],
    ['bpmn:DataStoreReference', 'data-store-reference'],
  ])('maps %s to %s', ($type, expected) => {
    expect(getElementTypeFromBo(makeBo($type))).toBe(expected)
  })

  it('returns unknown for unmapped types', () => {
    expect(getElementTypeFromBo(makeBo('bpmn:SomethingElse'))).toBe('unknown')
  })

  it('returns empty string for empty input', () => {
    expect(getElementTypeFromBo(undefined)).toBe('')
    expect(getElementTypeFromBo(null)).toBe('')
  })

  it('prioritizes the built-in form-task template over $type', () => {
    expect(getElementTypeFromBo(makeBo('bpmn:ServiceTask', FORM_TASK_TEMPLATE))).toBe('form-task')
  })

  it('prioritizes registered templates over $type', () => {
    registerTemplateType('my-connector:http', 'service-task')
    expect(getElementTypeFromBo(makeBo('bpmn:Task', 'my-connector:http'))).toBe('service-task')
  })

  it('batch-registers templates', () => {
    registerTemplateTypes({ 'my:custom-user': 'user-task', 'my:custom-send': 'send-task' })
    expect(getElementTypeFromBo(makeBo('bpmn:Task', 'my:custom-user'))).toBe('user-task')
    expect(getElementTypeFromBo(makeBo('bpmn:Task', 'my:custom-send'))).toBe('send-task')
  })
})

describe('getTypeIcon', () => {
  it('returns the mapped icon for a known type', () => {
    expect(getTypeIcon('user-task')).toBe('bpmn-icon-user-task')
    expect(getTypeIcon('start-event')).toBe('bpmn-icon-start-event-none')
  })

  it('falls back to the wrench icon for unknown types', () => {
    expect(getTypeIcon('does-not-exist')).toBe('bpmn-icon-screw-wrench')
  })
})

describe('getTaskSubType / getEventSubType', () => {
  it('returns the subtype for task types', () => {
    expect(getTaskSubType(makeBo('bpmn:UserTask'))).toBe('user-task')
    expect(getTaskSubType(makeBo('bpmn:CallActivity'))).toBe('call-activity')
  })

  it('returns empty string for non-task types', () => {
    expect(getTaskSubType(makeBo('bpmn:StartEvent'))).toBe('')
  })

  it('returns the subtype for event types', () => {
    expect(getEventSubType(makeBo('bpmn:StartEvent'))).toBe('start-event')
    expect(getEventSubType(makeBo('bpmn:IntermediateCatchEvent'))).toBe('intermediate-catch-event')
  })

  it('returns empty string for non-event types', () => {
    expect(getEventSubType(makeBo('bpmn:UserTask'))).toBe('')
  })
})
