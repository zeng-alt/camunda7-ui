import type { ElementName } from '@/components/bpmn-panel/designerConfig'
import type { ConfigurableNodesConfig } from './createConfigurableNodesModule'

const LOW_PRIORITY = 100

const CREATE_ACTION_NAMES_BY_TYPE: Partial<Record<ElementName, string[]>> = {
  'bpmn:StartEvent': [
    'none-start-event',
    'message-start',
    'timer-start',
    'conditional-start',
    'signal-start',
    'replace-with-non-interrupting-message-start',
    'replace-with-non-interrupting-timer-start',
    'replace-with-non-interrupting-conditional-start',
    'replace-with-non-interrupting-signal-start',
    'replace-with-non-interrupting-escalation-start',
  ],
  'bpmn:IntermediateCatchEvent': [
    'message-intermediate-catch',
    'timer-intermediate-catch',
    'conditional-intermediate-catch',
    'link-intermediate-catch',
    'signal-intermediate-catch',
  ],
  'bpmn:IntermediateThrowEvent': [
    'none-intermediate-throwing',
    'message-intermediate-throw',
    'escalation-intermediate-throw',
    'link-intermediate-throw',
    'compensation-intermediate-throw',
    'signal-intermediate-throw',
  ],
  'bpmn:EndEvent': [
    'none-end-event',
    'message-end',
    'escalation-end',
    'error-end',
    'cancel-end',
    'compensation-end',
    'signal-end',
    'terminate-end',
  ],
  'bpmn:BoundaryEvent': [
    'none-boundary-event',
    'message-boundary',
    'timer-boundary',
    'escalation-boundary',
    'conditional-boundary',
    'error-boundary',
    'cancel-boundary',
    'signal-boundary',
    'compensation-boundary',
    'non-interrupting-message-boundary',
    'non-interrupting-timer-boundary',
    'non-interrupting-escalation-boundary',
    'non-interrupting-conditional-boundary',
    'non-interrupting-signal-boundary',
  ],
  'bpmn:ExclusiveGateway': ['exclusive-gateway'],
  'bpmn:ParallelGateway': ['parallel-gateway'],
  'bpmn:InclusiveGateway': ['inclusive-gateway'],
  'bpmn:ComplexGateway': ['complex-gateway'],
  'bpmn:EventBasedGateway': ['event-based-gateway'],
  'bpmn:Task': ['task'],
  'bpmn:UserTask': ['user-task'],
  'bpmn:ServiceTask': ['service-task'],
  'bpmn:SendTask': ['send-task'],
  'bpmn:ReceiveTask': ['receive-task'],
  'bpmn:ManualTask': ['manual-task'],
  'bpmn:BusinessRuleTask': ['rule-task'],
  'bpmn:ScriptTask': ['script-task'],
  'bpmn:CallActivity': ['call-activity'],
  'bpmn:SubProcess': ['event-subprocess', 'collapsed-subprocess', 'expanded-subprocess'],
  'bpmn:AdHocSubProcess': ['collapsed-ad-hoc-subprocess', 'expanded-ad-hoc-subprocess'],
  'bpmn:Transaction': ['transaction'],
  'bpmn:DataObjectReference': ['data-object-reference'],
  'bpmn:DataStoreReference': ['data-store-reference'],
  'bpmn:Participant': ['expanded-pool', 'collapsed-pool'],
}

export default class ConfigurableCreateAppendMenuProvider {
  static $inject = ['popupMenu', 'configurableNodesConfig']

  private _hiddenActionNames: string[]

  constructor(popupMenu: any, configurableNodes: ConfigurableNodesConfig) {
    this._hiddenActionNames = Object.entries(CREATE_ACTION_NAMES_BY_TYPE).flatMap(
      ([type, actionNames]) => {
        const names = actionNames ?? []
        return configurableNodes.isElementVisible(type) ? [] : names
      },
    )

    popupMenu.registerProvider('bpmn-create', LOW_PRIORITY, this)
    popupMenu.registerProvider('bpmn-append', LOW_PRIORITY, this)
  }

  getPopupMenuEntries() {
    const hiddenActionNames = this._hiddenActionNames
    return (entries: Record<string, any>) => {
      for (const actionName of hiddenActionNames) {
        delete entries[`create-${actionName}`]
        delete entries[`append-${actionName}`]
      }
      return entries
    }
  }
}
