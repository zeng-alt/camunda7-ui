export const typeIconMap: Record<string, string> = {
  process: 'bpmn-icon-bpmn-io',
  'start-event': 'bpmn-icon-start-event-none',
  'end-event': 'bpmn-icon-end-event-none',
  'intermediate-throw-event': 'bpmn-icon-intermediate-event-none',
  'intermediate-catch-event': 'bpmn-icon-intermediate-event-none',
  'user-task': 'bpmn-icon-user-task',
  'service-task': 'bpmn-icon-service-task',
  'send-task': 'bpmn-icon-send-task',
  'receive-task': 'bpmn-icon-receive-task',
  'manual-task': 'bpmn-icon-manual-task',
  'script-task': 'bpmn-icon-script-task',
  'business-rule-task': 'bpmn-icon-business-rule-task',
  'call-activity': 'bpmn-icon-call-activity',
  'sub-process': 'bpmn-icon-subprocess-expanded',
  'ad-hoc-sub-process': 'bpmn-icon-subprocess-expanded',
  transaction: 'bpmn-icon-subprocess-expanded',
  task: 'bpmn-icon-task',
  'exclusive-gateway': 'bpmn-icon-gateway-xor',
  'parallel-gateway': 'bpmn-icon-gateway-parallel',
  'inclusive-gateway': 'bpmn-icon-gateway-or',
  'event-based-gateway': 'bpmn-icon-gateway-eventbased',
  gateway: 'bpmn-icon-gateway-complex',
  'sequence-flow': 'bpmn-icon-connection',
  collaboration: 'bpmn-icon-participant',
  participant: 'bpmn-icon-participant',
  lane: 'bpmn-icon-lane',
  'text-annotation': 'bpmn-icon-text-annotation',
  group: 'bpmn-icon-group',
  association: 'bpmn-icon-connection',
  'data-object-reference': 'bpmn-icon-data-object',
  'data-store-reference': 'bpmn-icon-data-store',
  unknown: 'bpmn-icon-screw-wrench',
}

export function getTypeIcon(type: string): string {
  return typeIconMap[type] || 'bpmn-icon-screw-wrench'
}

export const eventSubTypes = new Set([
  'start-event',
  'end-event',
  'intermediate-throw-event',
  'intermediate-catch-event',
  'boundary-event',
])

export const taskSubTypes = new Set([
  'user-task',
  'service-task',
  'send-task',
  'receive-task',
  'manual-task',
  'script-task',
  'business-rule-task',
  'call-activity',
  'task',
])

export function getElementTypeFromBo(bo: any): string {
  if (!bo) return ''
  const type: string = bo.$type || ''
  if (type.includes('AdHocSubProcess')) return 'ad-hoc-sub-process'
  if (type.includes('SubProcess')) return 'sub-process'
  if (type.includes('Transaction')) return 'transaction'
  if (type.includes('Collaboration')) return 'collaboration'
  if (type.includes('Process')) return 'process'
  if (type.includes('StartEvent')) return 'start-event'
  if (type.includes('EndEvent')) return 'end-event'
  if (type.includes('IntermediateThrowEvent')) return 'intermediate-throw-event'
  if (type.includes('IntermediateCatchEvent')) return 'intermediate-catch-event'
  if (type.includes('BoundaryEvent')) return 'boundary-event'
  if (type.includes('UserTask')) return 'user-task'
  if (type.includes('ServiceTask')) return 'service-task'
  if (type.includes('SendTask')) return 'send-task'
  if (type.includes('ReceiveTask')) return 'receive-task'
  if (type.includes('ManualTask')) return 'manual-task'
  if (type.includes('ScriptTask')) return 'script-task'
  if (type.includes('BusinessRuleTask')) return 'business-rule-task'
  if (type.includes('CallActivity')) return 'call-activity'
  if (type.includes('Task')) return 'task'
  if (type.includes('ExclusiveGateway')) return 'exclusive-gateway'
  if (type.includes('ParallelGateway')) return 'parallel-gateway'
  if (type.includes('InclusiveGateway')) return 'inclusive-gateway'
  if (type.includes('EventBasedGateway')) return 'event-based-gateway'
  if (type.includes('Gateway')) return 'gateway'
  if (type.includes('SequenceFlow')) return 'sequence-flow'
  if (type.includes('Participant')) return 'participant'
  if (type.includes('Lane')) return 'lane'
  if (type.includes('TextAnnotation')) return 'text-annotation'
  if (type.includes('Group')) return 'group'
  if (type.includes('Association')) return 'association'
  if (type.includes('DataObjectReference')) return 'data-object-reference'
  if (type.includes('DataStoreReference')) return 'data-store-reference'
  return 'unknown'
}

export function getElementType(element: any): string {
  return getElementTypeFromBo(element?.businessObject)
}

export function getTaskSubType(businessObject: any): string {
  const type = getElementTypeFromBo(businessObject)
  return taskSubTypes.has(type) ? type : ''
}

export function getEventSubType(businessObject: any): string {
  const type = getElementTypeFromBo(businessObject)
  return eventSubTypes.has(type) ? type : ''
}
