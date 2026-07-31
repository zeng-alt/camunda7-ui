import PaletteProvider from 'bpmn-js/lib/features/palette/PaletteProvider'
import type { ElementName } from '@/components/bpmn-panel/designerConfig'
import type { ConfigurableNodesConfig } from './createConfigurableNodesModule'

const PALETTE_ENTRY_TYPE: Record<string, ElementName> = {
  'create.start-event': 'bpmn:StartEvent',
  'create.intermediate-event': 'bpmn:IntermediateThrowEvent',
  'create.end-event': 'bpmn:EndEvent',
  'create.exclusive-gateway': 'bpmn:ExclusiveGateway',
  'create.task': 'bpmn:UserTask',
  'create.data-object': 'bpmn:DataObjectReference',
  'create.data-store': 'bpmn:DataStoreReference',
  'create.subprocess-expanded': 'bpmn:SubProcess',
  'create.participant-expanded': 'bpmn:Participant',
  'create.group': 'bpmn:Group',
}

export default class ConfigurablePaletteProvider extends PaletteProvider {
  static $inject = [...PaletteProvider.$inject, 'configurableNodesConfig']

  private _configurableNodes: ConfigurableNodesConfig
  private _create: any
  private _elementFactory: any
  private _translate: any

  constructor(
    palette: any,
    create: any,
    elementFactory: any,
    spaceTool: any,
    lassoTool: any,
    handTool: any,
    globalConnect: any,
    translate: any,
    configurableNodes: ConfigurableNodesConfig,
  ) {
    super(palette, create, elementFactory, spaceTool, lassoTool, handTool, globalConnect, translate)
    this._configurableNodes = configurableNodes
    this._create = create
    this._elementFactory = elementFactory
    this._translate = translate
  }

  getPaletteEntries(): ReturnType<PaletteProvider['getPaletteEntries']> {
    const entries = super.getPaletteEntries()
    const configurableNodes = this._configurableNodes

    for (const id of Object.keys(entries)) {
      const type = PALETTE_ENTRY_TYPE[id]
      if (type && !configurableNodes.isElementVisible(type)) {
        delete entries[id]
      }
    }

    const taskEntry = entries['create.task']
    if (taskEntry) {
      entries['create.task'] = {
        ...taskEntry,
        title: this._translate('Create user task'),
        action: {
          dragstart: (event: any) => this.createUserTask(event),
          click: (event: any) => this.createUserTask(event),
        },
      }
    }

    return entries
  }

  private createUserTask(event: any) {
    const shape = this._elementFactory.createShape({ type: 'bpmn:UserTask' })
    this._create.start(event, shape)
  }
}
