import ContextPadProvider from 'bpmn-js/lib/features/context-pad/ContextPadProvider'
import { contextPadTargets } from '@/utils/bpmn'
import type { ConfigurableNodesConfig } from './createConfigurableNodesModule'

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
      const target = contextPadTargets[id]
      if (target && !configurableNodes.isElementVisible(target)) {
        delete entries[id]
      }
    }

    return entries
  }
}
