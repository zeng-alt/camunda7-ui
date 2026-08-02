import ReplaceMenuProvider from 'bpmn-js/lib/features/popup-menu/ReplaceMenuProvider'
import { FORM_TASK_TEMPLATE, FORM_TASK_DELEGATE_EXPRESSION, replaceTargets } from '@/utils/bpmn'
import type { ConfigurableNodesConfig } from './createConfigurableNodesModule'

const FORM_TASK_ENTRY = 'replace-with-form-task'

export default class ConfigurableReplaceMenuProvider extends ReplaceMenuProvider {
  static $inject = [...ReplaceMenuProvider.$inject, 'configurableNodesConfig']

  private _configurableNodes: ConfigurableNodesConfig
  private _bpmnReplace: any
  private _modeling: any
  private _translate: any

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
    this._bpmnReplace = bpmnReplace
    this._modeling = modeling
    this._translate = translate
  }

  getPopupMenuEntries(target: any): ReturnType<ReplaceMenuProvider['getPopupMenuEntries']> {
    const entries = super.getPopupMenuEntries(target)
    const configurableNodes = this._configurableNodes

    for (const id of Object.keys(entries)) {
      const entryTarget = replaceTargets[id]
      if (entryTarget && !configurableNodes.isElementVisible(entryTarget)) {
        delete entries[id]
      }
    }

    if (
      configurableNodes.isElementVisible({ type: 'bpmn:ServiceTask' }) &&
      entries['replace-with-service-task']
    ) {
      entries[FORM_TASK_ENTRY] = {
        label: this._translate('Form task'),
        className: 'form-task-icon',
        action: () => this.replaceWithFormTask(target),
      }
    }

    return entries
  }

  private replaceWithFormTask(target: any) {
    const newElement = this._bpmnReplace.replaceElement(target, { type: 'bpmn:ServiceTask' })
    this._modeling.updateProperties(newElement, {
      modelerTemplate: FORM_TASK_TEMPLATE,
      delegateExpression: FORM_TASK_DELEGATE_EXPRESSION,
    })
  }
}
