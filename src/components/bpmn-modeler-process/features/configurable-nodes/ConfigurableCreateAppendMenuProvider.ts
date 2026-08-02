import {
  createAppendTargets,
  FORM_TASK_TEMPLATE,
  FORM_TASK_DELEGATE_EXPRESSION,
} from '@/utils/bpmn'
import type { ConfigurableNodesConfig } from './createConfigurableNodesModule'

const LOW_PRIORITY = 100

export default class ConfigurableCreateAppendMenuProvider {
  static $inject = [
    'popupMenu',
    'elementFactory',
    'bpmnFactory',
    'create',
    'autoPlace',
    'modeling',
    'selection',
    'mouse',
    'translate',
    'configurableNodesConfig',
  ]

  private configurableNodes: ConfigurableNodesConfig
  private elementFactory: any
  private bpmnFactory: any
  private create: any
  private autoPlace: any
  private modeling: any
  private selection: any
  private mouse: any
  private translate: any

  constructor(
    popupMenu: any,
    elementFactory: any,
    bpmnFactory: any,
    create: any,
    autoPlace: any,
    modeling: any,
    selection: any,
    mouse: any,
    translate: any,
    configurableNodes: ConfigurableNodesConfig,
  ) {
    this.configurableNodes = configurableNodes
    this.elementFactory = elementFactory
    this.bpmnFactory = bpmnFactory
    this.create = create
    this.autoPlace = autoPlace
    this.modeling = modeling
    this.selection = selection
    this.mouse = mouse
    this.translate = translate

    popupMenu.registerProvider('bpmn-create', LOW_PRIORITY, this)
    popupMenu.registerProvider('bpmn-append', LOW_PRIORITY, this)
  }

  getPopupMenuEntries() {
    return (entries: Record<string, any>) => {
      // Detect menu type from existing entries before any filtering
      const isCreateMenu = Object.keys(entries).some((k) => k.startsWith('create-'))

      for (const [actionName, target] of Object.entries(createAppendTargets)) {
        if (this.configurableNodes.isElementVisible(target)) {
          continue
        }

        delete entries[`create-${actionName}`]
        delete entries[`append-${actionName}`]
      }

      if (this.configurableNodes.isElementVisible({ type: 'bpmn:ServiceTask' })) {
        const key = isCreateMenu ? 'create-form-task' : 'append-form-task'
        if (!entries[key]) {
          entries[key] = this.createFormTaskEntry(isCreateMenu)
        }
      }

      return entries
    }
  }

  private createFormTaskEntry(isCreate: boolean) {
    return {
      label: this.translate('Form task'),
      className: 'form-task-icon',
      group: { id: 'tasks', name: this.translate('Tasks') },
      action: {
        click: (event: any) =>
          isCreate ? this.createFormTask(event) : this.appendFormTaskAutoPlace(),
        dragstart: (event: any) =>
          isCreate ? this.createFormTask(event) : this.appendFormTask(event),
      },
    }
  }

  private createFormTaskElement() {
    const businessObject = this.bpmnFactory.create('bpmn:ServiceTask', {
      modelerTemplate: FORM_TASK_TEMPLATE,
      delegateExpression: FORM_TASK_DELEGATE_EXPRESSION,
    })
    return this.elementFactory.createShape({
      type: 'bpmn:ServiceTask',
      businessObject,
    })
  }

  private createFormTask(event: any) {
    if (event instanceof KeyboardEvent) {
      event = this.mouse.getLastMoveEvent()
    }
    this.create.start(event, this.createFormTaskElement())
  }

  private appendFormTask(event: any) {
    const element = this.selection.get()[0]
    if (!element) return
    const newElement = this.createFormTaskElement()
    if (event instanceof KeyboardEvent) {
      event = this.mouse.getLastMoveEvent()
    }
    this.create.start(event, newElement, { source: element })
  }

  private appendFormTaskAutoPlace() {
    const element = this.selection.get()[0]
    if (!element) return
    this.autoPlace.append(element, this.createFormTaskElement())
  }
}
