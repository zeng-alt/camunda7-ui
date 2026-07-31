import ContextPadProvider from 'bpmn-js/lib/features/context-pad/ContextPadProvider'
import type { ElementName } from '@/components/bpmn-panel/designerConfig'
import type { ConfigurableNodesConfig } from './createConfigurableNodesModule'

const CONTEXT_PAD_APPEND_ENTRY_TYPE: Record<string, ElementName> = {
  'append.end-event': 'bpmn:EndEvent',
  'append.gateway': 'bpmn:ExclusiveGateway',
  'append.append-task': 'bpmn:Task',
  'append.intermediate-event': 'bpmn:IntermediateThrowEvent',
  'append.receive-task': 'bpmn:ReceiveTask',
  'append.message-intermediate-event': 'bpmn:IntermediateCatchEvent',
  'append.timer-intermediate-event': 'bpmn:IntermediateCatchEvent',
  'append.condition-intermediate-event': 'bpmn:IntermediateCatchEvent',
  'append.signal-intermediate-event': 'bpmn:IntermediateCatchEvent',
  'append.compensation-activity': 'bpmn:Task',
  'append.text-annotation': 'bpmn:TextAnnotation',
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
      const type = CONTEXT_PAD_APPEND_ENTRY_TYPE[id]
      if (type && !configurableNodes.isElementVisible(type)) {
        delete entries[id]
      }
    }

    return entries
  }
}
