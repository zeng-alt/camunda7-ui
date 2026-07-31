import { inject, provide, ref, type InjectionKey, type Ref } from 'vue'

export type ElementName =
  // events
  | 'bpmn:StartEvent'
  | 'bpmn:IntermediateCatchEvent'
  | 'bpmn:IntermediateThrowEvent'
  | 'bpmn:EndEvent'
  | 'bpmn:BoundaryEvent'
  // gateways
  | 'bpmn:ExclusiveGateway'
  | 'bpmn:ParallelGateway'
  | 'bpmn:InclusiveGateway'
  | 'bpmn:ComplexGateway'
  | 'bpmn:EventBasedGateway'
  // tasks & call activity
  | 'bpmn:Task'
  | 'bpmn:UserTask'
  | 'bpmn:ServiceTask'
  | 'bpmn:SendTask'
  | 'bpmn:ReceiveTask'
  | 'bpmn:ManualTask'
  | 'bpmn:BusinessRuleTask'
  | 'bpmn:ScriptTask'
  | 'bpmn:CallActivity'
  // sub-processes
  | 'bpmn:SubProcess'
  | 'bpmn:AdHocSubProcess'
  | 'bpmn:Transaction'
  // data
  | 'bpmn:DataObjectReference'
  | 'bpmn:DataStoreReference'
  // collaboration
  | 'bpmn:Participant'
  // artifacts
  | 'bpmn:Group'
  | 'bpmn:TextAnnotation'

export type ElementKey =
  | ElementName
  // start event variants
  | 'bpmn:StartEvent#none'
  | 'bpmn:StartEvent#bpmn:MessageEventDefinition'
  | 'bpmn:StartEvent#bpmn:TimerEventDefinition'
  | 'bpmn:StartEvent#bpmn:ConditionalEventDefinition'
  | 'bpmn:StartEvent#bpmn:SignalEventDefinition'
  | 'bpmn:StartEvent#bpmn:EscalationEventDefinition'
  | 'bpmn:StartEvent#bpmn:ErrorEventDefinition'
  | 'bpmn:StartEvent#bpmn:CompensateEventDefinition'
  // intermediate catch event variants
  | 'bpmn:IntermediateCatchEvent#bpmn:MessageEventDefinition'
  | 'bpmn:IntermediateCatchEvent#bpmn:TimerEventDefinition'
  | 'bpmn:IntermediateCatchEvent#bpmn:ConditionalEventDefinition'
  | 'bpmn:IntermediateCatchEvent#bpmn:LinkEventDefinition'
  | 'bpmn:IntermediateCatchEvent#bpmn:SignalEventDefinition'
  // intermediate throw event variants
  | 'bpmn:IntermediateThrowEvent#none'
  | 'bpmn:IntermediateThrowEvent#bpmn:MessageEventDefinition'
  | 'bpmn:IntermediateThrowEvent#bpmn:EscalationEventDefinition'
  | 'bpmn:IntermediateThrowEvent#bpmn:LinkEventDefinition'
  | 'bpmn:IntermediateThrowEvent#bpmn:CompensateEventDefinition'
  | 'bpmn:IntermediateThrowEvent#bpmn:SignalEventDefinition'
  // end event variants
  | 'bpmn:EndEvent#none'
  | 'bpmn:EndEvent#bpmn:MessageEventDefinition'
  | 'bpmn:EndEvent#bpmn:EscalationEventDefinition'
  | 'bpmn:EndEvent#bpmn:ErrorEventDefinition'
  | 'bpmn:EndEvent#bpmn:CancelEventDefinition'
  | 'bpmn:EndEvent#bpmn:CompensateEventDefinition'
  | 'bpmn:EndEvent#bpmn:SignalEventDefinition'
  | 'bpmn:EndEvent#bpmn:TerminateEventDefinition'
  // boundary event variants
  | 'bpmn:BoundaryEvent#none'
  | 'bpmn:BoundaryEvent#bpmn:MessageEventDefinition'
  | 'bpmn:BoundaryEvent#bpmn:TimerEventDefinition'
  | 'bpmn:BoundaryEvent#bpmn:EscalationEventDefinition'
  | 'bpmn:BoundaryEvent#bpmn:ConditionalEventDefinition'
  | 'bpmn:BoundaryEvent#bpmn:ErrorEventDefinition'
  | 'bpmn:BoundaryEvent#bpmn:CancelEventDefinition'
  | 'bpmn:BoundaryEvent#bpmn:SignalEventDefinition'
  | 'bpmn:BoundaryEvent#bpmn:CompensateEventDefinition'

export type TabName =
  // common
  | 'general'
  | 'extensionProperties'
  | 'custom'
  // camunda common
  | 'executionListeners'
  | 'multiInstance'
  | 'input'
  | 'output'
  | 'inputs'
  | 'outputs'
  | 'taskListeners'
  | 'process'
  | 'globalForm'
  // start event
  | 'startEvent'
  | 'forms'
  // events
  | 'intermediateThrow'
  | 'intermediateCatch'
  | 'endEvent'
  | 'boundary'
  // tasks
  | 'implementation'
  | 'fieldInjections'
  | 'userTask'
  | 'script'
  | 'receiveTask'
  | 'external'
  // flow & sub-process & call activity
  | 'sequenceFlow'
  | 'adHocSubProcess'
  | 'callActivity'

export const defaultElementVisibility: Record<ElementKey, boolean> = {
  // events
  'bpmn:StartEvent': true,
  'bpmn:IntermediateCatchEvent': true,
  'bpmn:IntermediateThrowEvent': true,
  'bpmn:EndEvent': true,
  'bpmn:BoundaryEvent': false,
  // gateways
  'bpmn:ExclusiveGateway': true,
  'bpmn:ParallelGateway': true,
  'bpmn:InclusiveGateway': true,
  'bpmn:ComplexGateway': false,
  'bpmn:EventBasedGateway': true,
  // tasks & call activity
  'bpmn:Task': true,
  'bpmn:UserTask': true,
  'bpmn:ServiceTask': true,
  'bpmn:SendTask': true,
  'bpmn:ReceiveTask': true,
  'bpmn:ManualTask': false,
  'bpmn:BusinessRuleTask': false,
  'bpmn:ScriptTask': false,
  'bpmn:CallActivity': false,
  // sub-processes
  'bpmn:SubProcess': false,
  'bpmn:AdHocSubProcess': false,
  'bpmn:Transaction': true,
  // data
  'bpmn:DataObjectReference': false,
  'bpmn:DataStoreReference': false,
  // collaboration
  'bpmn:Participant': false,
  // artifacts
  'bpmn:Group': false,
  'bpmn:TextAnnotation': true,
  // start event variants
  'bpmn:StartEvent#none': true,
  'bpmn:StartEvent#bpmn:MessageEventDefinition': true,
  'bpmn:StartEvent#bpmn:TimerEventDefinition': true,
  'bpmn:StartEvent#bpmn:ConditionalEventDefinition': true,
  'bpmn:StartEvent#bpmn:SignalEventDefinition': true,
  'bpmn:StartEvent#bpmn:EscalationEventDefinition': false,
  'bpmn:StartEvent#bpmn:ErrorEventDefinition': false,
  'bpmn:StartEvent#bpmn:CompensateEventDefinition': false,
  // intermediate catch event variants
  'bpmn:IntermediateCatchEvent#bpmn:MessageEventDefinition': true,
  'bpmn:IntermediateCatchEvent#bpmn:TimerEventDefinition': true,
  'bpmn:IntermediateCatchEvent#bpmn:ConditionalEventDefinition': true,
  'bpmn:IntermediateCatchEvent#bpmn:LinkEventDefinition': true,
  'bpmn:IntermediateCatchEvent#bpmn:SignalEventDefinition': true,
  // intermediate throw event variants
  'bpmn:IntermediateThrowEvent#none': true,
  'bpmn:IntermediateThrowEvent#bpmn:MessageEventDefinition': true,
  'bpmn:IntermediateThrowEvent#bpmn:EscalationEventDefinition': false,
  'bpmn:IntermediateThrowEvent#bpmn:LinkEventDefinition': true,
  'bpmn:IntermediateThrowEvent#bpmn:CompensateEventDefinition': false,
  'bpmn:IntermediateThrowEvent#bpmn:SignalEventDefinition': true,
  // end event variants
  'bpmn:EndEvent#none': true,
  'bpmn:EndEvent#bpmn:MessageEventDefinition': true,
  'bpmn:EndEvent#bpmn:EscalationEventDefinition': false,
  'bpmn:EndEvent#bpmn:ErrorEventDefinition': false,
  'bpmn:EndEvent#bpmn:CancelEventDefinition': true,
  'bpmn:EndEvent#bpmn:CompensateEventDefinition': false,
  'bpmn:EndEvent#bpmn:SignalEventDefinition': true,
  'bpmn:EndEvent#bpmn:TerminateEventDefinition': true,
  // boundary event variants
  'bpmn:BoundaryEvent#none': false,
  'bpmn:BoundaryEvent#bpmn:MessageEventDefinition': false,
  'bpmn:BoundaryEvent#bpmn:TimerEventDefinition': false,
  'bpmn:BoundaryEvent#bpmn:EscalationEventDefinition': false,
  'bpmn:BoundaryEvent#bpmn:ConditionalEventDefinition': false,
  'bpmn:BoundaryEvent#bpmn:ErrorEventDefinition': false,
  'bpmn:BoundaryEvent#bpmn:CancelEventDefinition': false,
  'bpmn:BoundaryEvent#bpmn:SignalEventDefinition': false,
  'bpmn:BoundaryEvent#bpmn:CompensateEventDefinition': false,
}

export const defaultTabVisibility: Record<TabName, boolean> = {
  // common
  general: true,
  extensionProperties: false,
  custom: true,
  // camunda common
  executionListeners: false,
  multiInstance: true,
  input: false,
  output: false,
  inputs: false,
  outputs: false,
  taskListeners: true,
  process: true,
  globalForm: true,
  // start event
  startEvent: true,
  forms: true,
  // events
  intermediateThrow: true,
  intermediateCatch: true,
  endEvent: true,
  boundary: false,
  // tasks
  implementation: true,
  fieldInjections: true,
  userTask: true,
  script: true,
  receiveTask: true,
  external: true,
  // flow & sub-process & call activity
  sequenceFlow: true,
  adHocSubProcess: true,
  callActivity: true,
}

export interface DesignerConfig {
  elements?: Partial<Record<ElementKey, boolean>>
  tabs?: Partial<Record<TabName, boolean>>
}

export const defaultDesignerConfig: DesignerConfig = {
  elements: defaultElementVisibility,
  tabs: defaultTabVisibility,
}

export interface DesignerConfigState {
  proDesigner: boolean
  elements: Partial<Record<ElementKey, boolean>>
  tabs: Record<TabName, boolean>
}

function createAllVisibleRecord<T extends string>(
  defaults: Record<T, boolean>,
): Record<T, boolean> {
  return Object.fromEntries(Object.keys(defaults).map((key) => [key, true])) as Record<T, boolean>
}

export function resolveDesignerConfig(
  proDesigner: boolean,
  config?: DesignerConfig,
): DesignerConfigState {
  if (proDesigner) {
    return {
      proDesigner: true,
      elements: createAllVisibleRecord(defaultElementVisibility),
      tabs: createAllVisibleRecord(defaultTabVisibility),
    }
  }
  return {
    proDesigner: false,
    elements: { ...defaultElementVisibility, ...config?.elements },
    tabs: { ...defaultTabVisibility, ...config?.tabs },
  }
}

export const designerConfigInjectionKey: InjectionKey<Ref<DesignerConfigState>> =
  Symbol('designerConfig')

export function provideDesignerConfig(state: Ref<DesignerConfigState>) {
  provide(designerConfigInjectionKey, state)
}

export function useDesignerConfig(): Ref<DesignerConfigState> {
  return inject(designerConfigInjectionKey, ref(resolveDesignerConfig(true)))
}
