import type { ElementKey, ElementName } from '@/components/bpmn-panel/designerConfig'
import * as ReplaceOptions from 'bpmn-js/lib/features/replace/ReplaceOptions'

export interface ActionTarget {
  type: ElementName
  eventDefinitionType?: string
}

/**
 * Builds the designerConfig element key for a target, e.g.
 * 'bpmn:StartEvent' -> 'bpmn:StartEvent#none',
 * { type: 'bpmn:EndEvent', eventDefinitionType: 'bpmn:MessageEventDefinition' } -> 'bpmn:EndEvent#bpmn:MessageEventDefinition'
 */
export function toElementKey(target: ActionTarget): ElementKey {
  return (
    target.eventDefinitionType
      ? `${target.type}#${target.eventDefinitionType}`
      : `${target.type}#none`
  ) as ElementKey
}

/**
 * Single source of truth for create/append menu action names -> element targets.
 * Both `create-<action>` and `append-<action>` menu entries derive from these.
 */
export const createAppendTargets: Record<string, ActionTarget> = {
  // start events
  'none-start-event': { type: 'bpmn:StartEvent' },
  'message-start': { type: 'bpmn:StartEvent', eventDefinitionType: 'bpmn:MessageEventDefinition' },
  'timer-start': { type: 'bpmn:StartEvent', eventDefinitionType: 'bpmn:TimerEventDefinition' },
  'conditional-start': {
    type: 'bpmn:StartEvent',
    eventDefinitionType: 'bpmn:ConditionalEventDefinition',
  },
  'signal-start': { type: 'bpmn:StartEvent', eventDefinitionType: 'bpmn:SignalEventDefinition' },
  'replace-with-non-interrupting-message-start': {
    type: 'bpmn:StartEvent',
    eventDefinitionType: 'bpmn:MessageEventDefinition',
  },
  'replace-with-non-interrupting-timer-start': {
    type: 'bpmn:StartEvent',
    eventDefinitionType: 'bpmn:TimerEventDefinition',
  },
  'replace-with-non-interrupting-conditional-start': {
    type: 'bpmn:StartEvent',
    eventDefinitionType: 'bpmn:ConditionalEventDefinition',
  },
  'replace-with-non-interrupting-signal-start': {
    type: 'bpmn:StartEvent',
    eventDefinitionType: 'bpmn:SignalEventDefinition',
  },
  'replace-with-non-interrupting-escalation-start': {
    type: 'bpmn:StartEvent',
    eventDefinitionType: 'bpmn:EscalationEventDefinition',
  },
  // intermediate catch events
  'message-intermediate-catch': {
    type: 'bpmn:IntermediateCatchEvent',
    eventDefinitionType: 'bpmn:MessageEventDefinition',
  },
  'timer-intermediate-catch': {
    type: 'bpmn:IntermediateCatchEvent',
    eventDefinitionType: 'bpmn:TimerEventDefinition',
  },
  'conditional-intermediate-catch': {
    type: 'bpmn:IntermediateCatchEvent',
    eventDefinitionType: 'bpmn:ConditionalEventDefinition',
  },
  'link-intermediate-catch': {
    type: 'bpmn:IntermediateCatchEvent',
    eventDefinitionType: 'bpmn:LinkEventDefinition',
  },
  'signal-intermediate-catch': {
    type: 'bpmn:IntermediateCatchEvent',
    eventDefinitionType: 'bpmn:SignalEventDefinition',
  },
  // intermediate throw events
  'none-intermediate-throwing': { type: 'bpmn:IntermediateThrowEvent' },
  'message-intermediate-throw': {
    type: 'bpmn:IntermediateThrowEvent',
    eventDefinitionType: 'bpmn:MessageEventDefinition',
  },
  'escalation-intermediate-throw': {
    type: 'bpmn:IntermediateThrowEvent',
    eventDefinitionType: 'bpmn:EscalationEventDefinition',
  },
  'link-intermediate-throw': {
    type: 'bpmn:IntermediateThrowEvent',
    eventDefinitionType: 'bpmn:LinkEventDefinition',
  },
  'compensation-intermediate-throw': {
    type: 'bpmn:IntermediateThrowEvent',
    eventDefinitionType: 'bpmn:CompensateEventDefinition',
  },
  'signal-intermediate-throw': {
    type: 'bpmn:IntermediateThrowEvent',
    eventDefinitionType: 'bpmn:SignalEventDefinition',
  },
  // end events
  'none-end-event': { type: 'bpmn:EndEvent' },
  'message-end': { type: 'bpmn:EndEvent', eventDefinitionType: 'bpmn:MessageEventDefinition' },
  'escalation-end': {
    type: 'bpmn:EndEvent',
    eventDefinitionType: 'bpmn:EscalationEventDefinition',
  },
  'error-end': { type: 'bpmn:EndEvent', eventDefinitionType: 'bpmn:ErrorEventDefinition' },
  'cancel-end': { type: 'bpmn:EndEvent', eventDefinitionType: 'bpmn:CancelEventDefinition' },
  'compensation-end': {
    type: 'bpmn:EndEvent',
    eventDefinitionType: 'bpmn:CompensateEventDefinition',
  },
  'signal-end': { type: 'bpmn:EndEvent', eventDefinitionType: 'bpmn:SignalEventDefinition' },
  'terminate-end': {
    type: 'bpmn:EndEvent',
    eventDefinitionType: 'bpmn:TerminateEventDefinition',
  },
  // boundary events
  'none-boundary-event': { type: 'bpmn:BoundaryEvent' },
  'message-boundary': {
    type: 'bpmn:BoundaryEvent',
    eventDefinitionType: 'bpmn:MessageEventDefinition',
  },
  'timer-boundary': {
    type: 'bpmn:BoundaryEvent',
    eventDefinitionType: 'bpmn:TimerEventDefinition',
  },
  'escalation-boundary': {
    type: 'bpmn:BoundaryEvent',
    eventDefinitionType: 'bpmn:EscalationEventDefinition',
  },
  'conditional-boundary': {
    type: 'bpmn:BoundaryEvent',
    eventDefinitionType: 'bpmn:ConditionalEventDefinition',
  },
  'error-boundary': {
    type: 'bpmn:BoundaryEvent',
    eventDefinitionType: 'bpmn:ErrorEventDefinition',
  },
  'cancel-boundary': {
    type: 'bpmn:BoundaryEvent',
    eventDefinitionType: 'bpmn:CancelEventDefinition',
  },
  'signal-boundary': {
    type: 'bpmn:BoundaryEvent',
    eventDefinitionType: 'bpmn:SignalEventDefinition',
  },
  'compensation-boundary': {
    type: 'bpmn:BoundaryEvent',
    eventDefinitionType: 'bpmn:CompensateEventDefinition',
  },
  'non-interrupting-message-boundary': {
    type: 'bpmn:BoundaryEvent',
    eventDefinitionType: 'bpmn:MessageEventDefinition',
  },
  'non-interrupting-timer-boundary': {
    type: 'bpmn:BoundaryEvent',
    eventDefinitionType: 'bpmn:TimerEventDefinition',
  },
  'non-interrupting-escalation-boundary': {
    type: 'bpmn:BoundaryEvent',
    eventDefinitionType: 'bpmn:EscalationEventDefinition',
  },
  'non-interrupting-conditional-boundary': {
    type: 'bpmn:BoundaryEvent',
    eventDefinitionType: 'bpmn:ConditionalEventDefinition',
  },
  'non-interrupting-signal-boundary': {
    type: 'bpmn:BoundaryEvent',
    eventDefinitionType: 'bpmn:SignalEventDefinition',
  },
  // gateways
  'exclusive-gateway': { type: 'bpmn:ExclusiveGateway' },
  'parallel-gateway': { type: 'bpmn:ParallelGateway' },
  'inclusive-gateway': { type: 'bpmn:InclusiveGateway' },
  'complex-gateway': { type: 'bpmn:ComplexGateway' },
  'event-based-gateway': { type: 'bpmn:EventBasedGateway' },
  // tasks
  task: { type: 'bpmn:Task' },
  'user-task': { type: 'bpmn:UserTask' },
  'service-task': { type: 'bpmn:ServiceTask' },
  'form-task': { type: 'bpmn:ServiceTask' },
  'send-task': { type: 'bpmn:SendTask' },
  'receive-task': { type: 'bpmn:ReceiveTask' },
  'manual-task': { type: 'bpmn:ManualTask' },
  'rule-task': { type: 'bpmn:BusinessRuleTask' },
  'script-task': { type: 'bpmn:ScriptTask' },
  // call activity & sub-processes
  'call-activity': { type: 'bpmn:CallActivity' },
  transaction: { type: 'bpmn:Transaction' },
  'event-subprocess': { type: 'bpmn:SubProcess' },
  'collapsed-subprocess': { type: 'bpmn:SubProcess' },
  'expanded-subprocess': { type: 'bpmn:SubProcess' },
  'collapsed-ad-hoc-subprocess': { type: 'bpmn:AdHocSubProcess' },
  'expanded-ad-hoc-subprocess': { type: 'bpmn:AdHocSubProcess' },
  // data
  'data-store-reference': { type: 'bpmn:DataStoreReference' },
  'data-object-reference': { type: 'bpmn:DataObjectReference' },
  // collaboration
  'expanded-pool': { type: 'bpmn:Participant' },
  'collapsed-pool': { type: 'bpmn:Participant' },
}

/** Palette entry ids -> element targets. */
export const paletteTargets: Record<string, ActionTarget> = {
  'create.start-event': { type: 'bpmn:StartEvent' },
  'create.intermediate-event': { type: 'bpmn:IntermediateThrowEvent' },
  'create.end-event': { type: 'bpmn:EndEvent' },
  'create.exclusive-gateway': { type: 'bpmn:ExclusiveGateway' },
  'create.task': { type: 'bpmn:UserTask' },
  'create.form-task': { type: 'bpmn:ServiceTask' },
  'create.data-object': { type: 'bpmn:DataObjectReference' },
  'create.data-store': { type: 'bpmn:DataStoreReference' },
  'create.subprocess-expanded': { type: 'bpmn:SubProcess' },
  'create.participant-expanded': { type: 'bpmn:Participant' },
  'create.group': { type: 'bpmn:Group' },
}

/** Context pad append entry ids -> element targets. */
export const contextPadTargets: Record<string, ActionTarget> = {
  'append.end-event': { type: 'bpmn:EndEvent' },
  'append.gateway': { type: 'bpmn:ExclusiveGateway' },
  'append.append-task': { type: 'bpmn:Task' },
  'append.intermediate-event': { type: 'bpmn:IntermediateThrowEvent' },
  'append.receive-task': { type: 'bpmn:ReceiveTask' },
  'append.message-intermediate-event': {
    type: 'bpmn:IntermediateCatchEvent',
    eventDefinitionType: 'bpmn:MessageEventDefinition',
  },
  'append.timer-intermediate-event': {
    type: 'bpmn:IntermediateCatchEvent',
    eventDefinitionType: 'bpmn:TimerEventDefinition',
  },
  'append.condition-intermediate-event': {
    type: 'bpmn:IntermediateCatchEvent',
    eventDefinitionType: 'bpmn:ConditionalEventDefinition',
  },
  'append.signal-intermediate-event': {
    type: 'bpmn:IntermediateCatchEvent',
    eventDefinitionType: 'bpmn:SignalEventDefinition',
  },
  'append.compensation-activity': { type: 'bpmn:Task' },
  'append.text-annotation': { type: 'bpmn:TextAnnotation' },
}

/** Replace action names -> element targets, collected from bpmn-js ReplaceOptions. */
export const replaceTargets: Record<string, ActionTarget> = collectReplaceTargets()

function collectReplaceTargets(): Record<string, ActionTarget> {
  const targets: Record<string, ActionTarget> = {}

  const collect = (options: ReplaceOptions.ReplaceOption[]) => {
    for (const option of options) {
      if (option.target) {
        targets[option.actionName] = option.target as ActionTarget
      }
    }
  }

  for (const options of [
    ReplaceOptions.START_EVENT,
    ReplaceOptions.START_EVENT_SUB_PROCESS,
    ReplaceOptions.INTERMEDIATE_EVENT,
    ReplaceOptions.END_EVENT,
    ReplaceOptions.GATEWAY,
    ReplaceOptions.SUBPROCESS_EXPANDED,
    ReplaceOptions.AD_HOC_SUBPROCESS_EXPANDED,
    ReplaceOptions.TRANSACTION,
    ReplaceOptions.EVENT_SUB_PROCESS,
    ReplaceOptions.TASK,
    ReplaceOptions.DATA_OBJECT_REFERENCE,
    ReplaceOptions.DATA_STORE_REFERENCE,
    ReplaceOptions.BOUNDARY_EVENT,
    ReplaceOptions.EVENT_SUB_PROCESS_START_EVENT,
    ReplaceOptions.PARTICIPANT,
  ]) {
    collect(options)
  }

  for (const options of Object.values(ReplaceOptions.TYPED_EVENT)) {
    collect(options)
  }

  return targets
}
