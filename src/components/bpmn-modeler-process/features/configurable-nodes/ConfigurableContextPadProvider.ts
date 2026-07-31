import ContextPadProvider from 'bpmn-js/lib/features/context-pad/ContextPadProvider'
import type { ElementName } from '@/components/bpmn-panel/designerConfig'
import type { ConfigurableNodesConfig } from './createConfigurableNodesModule'

interface ContextPadTarget {
  type: ElementName
  eventDefinitionType?: string
}

const CONTEXT_PAD_APPEND_ENTRY_TYPE: Record<string, ContextPadTarget> = {
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

export default class ConfigurableContextPadProvider extends ContextPadProvider {
  static $inject = [...ContextPadProvider.$inject, 'configurableNodesConfig']

  private _configurableNodes: ConfigurableNodesConfig

  constructor(
    config: any,
    injector: any,
    eventBus: any,
    contextPad: any,
    modeling: any,
    elementFactory: any,
    connect: any,
    create: any,
    popupMenu: any,
    canvas: any,
    rules: any,
    translate: any,
    appendPreview: any,
    configurableNodes: ConfigurableNodesConfig,
  ) {
    super(
      config,
      injector,
      eventBus,
      contextPad,
      modeling,
      elementFactory,
      connect,
      create,
      popupMenu,
      canvas,
      rules,
      translate,
      appendPreview,
    )
    this._configurableNodes = configurableNodes
  }

  getContextPadEntries(element: any): ReturnType<ContextPadProvider['getContextPadEntries']> {
    const entries = super.getContextPadEntries(element)
    const configurableNodes = this._configurableNodes

    for (const id of Object.keys(entries)) {
      const target = CONTEXT_PAD_APPEND_ENTRY_TYPE[id]
      if (target && !configurableNodes.isElementVisible(target.type, target.eventDefinitionType)) {
        delete entries[id]
      }
    }

    return entries
  }
}
