import ReplaceMenuProvider from 'bpmn-js/lib/features/popup-menu/ReplaceMenuProvider'
import type { ConfigurableNodesConfig } from './createConfigurableNodesModule'

export default class ConfigurableReplaceMenuProvider extends ReplaceMenuProvider {
  static $inject = [...ReplaceMenuProvider.$inject, 'configurableNodesConfig']

  private _configurableNodes: ConfigurableNodesConfig

  constructor(
    bpmnFactory: any,
    popupMenu: any,
    modeling: any,
    moddle: any,
    bpmnReplace: any,
    rules: any,
    translate: any,
    moddleCopy: any,
    configurableNodes: ConfigurableNodesConfig,
  ) {
    super(bpmnFactory, popupMenu, modeling, moddle, bpmnReplace, rules, translate, moddleCopy)
    this._configurableNodes = configurableNodes
  }

  _createEntries(target: any, replaceOptions: any[]) {
    const configurableNodes = this._configurableNodes

    const filtered = replaceOptions.filter((option) => {
      const { type, eventDefinitionType } = option.target ?? {}
      return !type || configurableNodes.isElementVisible(type, eventDefinitionType)
    })

    const prototype: any = ReplaceMenuProvider.prototype
    return prototype._createEntries.call(this, target, filtered)
  }
}
