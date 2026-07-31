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

export const defaultElementVisibility: Record<ElementName, boolean> = {
  // events
  'bpmn:StartEvent': false,
  'bpmn:IntermediateCatchEvent': true,
  'bpmn:IntermediateThrowEvent': true,
  'bpmn:EndEvent': true,
  'bpmn:BoundaryEvent': false,
  // gateways
  'bpmn:ExclusiveGateway': true,
  'bpmn:ParallelGateway': true,
  'bpmn:InclusiveGateway': true,
  'bpmn:ComplexGateway': true,
  'bpmn:EventBasedGateway': true,
  // tasks & call activity
  'bpmn:Task': true,
  'bpmn:UserTask': true,
  'bpmn:ServiceTask': true,
  'bpmn:SendTask': true,
  'bpmn:ReceiveTask': true,
  'bpmn:ManualTask': true,
  'bpmn:BusinessRuleTask': true,
  'bpmn:ScriptTask': true,
  'bpmn:CallActivity': true,
  // sub-processes
  'bpmn:SubProcess': true,
  'bpmn:AdHocSubProcess': true,
  'bpmn:Transaction': true,
  // data
  'bpmn:DataObjectReference': true,
  'bpmn:DataStoreReference': true,
  // collaboration
  'bpmn:Participant': true,
  // artifacts
  'bpmn:Group': true,
  'bpmn:TextAnnotation': true,
}

export const defaultTabVisibility: Record<TabName, boolean> = {
  // common
  general: true,
  extensionProperties: true,
  custom: true,
  // camunda common
  executionListeners: true,
  multiInstance: true,
  input: true,
  output: true,
  inputs: true,
  outputs: true,
  taskListeners: true,
  process: true,
  // start event
  startEvent: true,
  forms: true,
  // events
  intermediateThrow: true,
  intermediateCatch: true,
  endEvent: true,
  boundary: true,
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
  elements?: Partial<Record<ElementName, boolean>>
  tabs?: Partial<Record<TabName, boolean>>
}

export const defaultDesignerConfig: DesignerConfig = {
  elements: defaultElementVisibility,
  tabs: defaultTabVisibility,
}

export interface DesignerConfigState {
  proDesigner: boolean
  elements: Record<ElementName, boolean>
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
