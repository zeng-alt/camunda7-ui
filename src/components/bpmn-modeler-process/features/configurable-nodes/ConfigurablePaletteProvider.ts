import PaletteProvider from 'bpmn-js/lib/features/palette/PaletteProvider'
import type { ElementName } from '@/components/bpmn-panel/designerConfig'
import type { ConfigurableNodesConfig } from './createConfigurableNodesModule'

const PALETTE_ENTRY_TYPE: Record<string, ElementName> = {
  'create.start-event': 'bpmn:StartEvent',
  'create.intermediate-event': 'bpmn:IntermediateThrowEvent',
  'create.end-event': 'bpmn:EndEvent',
  'create.exclusive-gateway': 'bpmn:ExclusiveGateway',
  'create.task': 'bpmn:Task',
  'create.data-object': 'bpmn:DataObjectReference',
  'create.data-store': 'bpmn:DataStoreReference',
  'create.subprocess-expanded': 'bpmn:SubProcess',
  'create.participant-expanded': 'bpmn:Participant',
  'create.group': 'bpmn:Group',
}

export default class ConfigurablePaletteProvider extends PaletteProvider {
  static $inject = [...PaletteProvider.$inject, 'configurableNodesConfig']

  private _configurableNodes: ConfigurableNodesConfig

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

    return entries
  }
}
