import type { ElementName } from '@/components/bpmn-panel/designerConfig'
import type { ConfigurableNodesConfig } from './createConfigurableNodesModule'

const LOW_PRIORITY = 100

interface CreateActionTarget {
  type: ElementName
  eventDefinitionType?: string
}

const CREATE_ACTION_TARGET: Record<string, CreateActionTarget> = {
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

export default class ConfigurableCreateAppendMenuProvider {
  static $inject = ['popupMenu', 'configurableNodesConfig']

  private configurableNodes: ConfigurableNodesConfig

  constructor(popupMenu: any, configurableNodes: ConfigurableNodesConfig) {
    this.configurableNodes = configurableNodes

    popupMenu.registerProvider('bpmn-create', LOW_PRIORITY, this)
    popupMenu.registerProvider('bpmn-append', LOW_PRIORITY, this)
  }

  getPopupMenuEntries() {
    return (entries: Record<string, any>) => {
      for (const [actionName, target] of Object.entries(CREATE_ACTION_TARGET)) {
        const visible = this.configurableNodes.isElementVisible(
          target.type,
          target.eventDefinitionType,
        )

        if (visible) {
          continue
        }

        delete entries[`create-${actionName}`]
        delete entries[`append-${actionName}`]
      }
      return entries
    }
  }
}
