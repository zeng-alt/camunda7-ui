import ContextPadProvider from 'bpmn-js/lib/features/context-pad/ContextPadProvider'
import type { ElementName } from '@/components/bpmn-panel/designerConfig'
import { FORM_TASK_TEMPLATE, FORM_TASK_DELEGATE_EXPRESSION } from '@/utils/bpmn'
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
  static $inject = [...ContextPadProvider.$inject, 'bpmnFactory', 'configurableNodesConfig']

  private _configurableNodes: ConfigurableNodesConfig
  private _bpmnFactory: any
  private _create: any
  private _autoPlace: any
  private _modeling: any
  private _elementFactory: any
  private _selection: any

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
    bpmnFactory: any,
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
    this._bpmnFactory = bpmnFactory
    this._create = create
    this._autoPlace = injector.get('autoPlace', false)
    this._modeling = modeling
    this._elementFactory = elementFactory
    this._selection = injector.get('selection')
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

    // if (this._autoPlace && configurableNodes.isElementVisible('bpmn:ServiceTask')) {
    //   entries['append.form-task'] = {
    //     group: 'append',
    //     className: 'form-task-icon',
    //     title: 'Append form task',
    //     action: {
    //       click: () => this.appendFormTaskAutoPlace(),
    //       dragstart: (event: any) => this.appendFormTask(event),
    //     },
    //   }
    // }

    return entries
  }

  // private createFormTaskElement() {
  //   const businessObject = this._bpmnFactory.create('bpmn:ServiceTask', {
  //     modelerTemplate: FORM_TASK_TEMPLATE,
  //     delegateExpression: FORM_TASK_DELEGATE_EXPRESSION,
  //   })
  //   return this._elementFactory.createShape({
  //     type: 'bpmn:ServiceTask',
  //     businessObject,
  //   })
  // }

  // private appendFormTask(event: any) {
  //   const element = this._selection.get()[0]
  //   if (!element) return
  //   this._create.start(event, this.createFormTaskElement(), { source: element })
  // }

  // private appendFormTaskAutoPlace() {
  //   const element = this._selection.get()[0]
  //   if (!element) return
  //   this._autoPlace.append(element, this.createFormTaskElement())
  // }
}
