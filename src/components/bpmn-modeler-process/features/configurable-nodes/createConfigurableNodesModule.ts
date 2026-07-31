import type { ElementName } from '@/components/bpmn-panel/designerConfig'
import ConfigurablePaletteProvider from './ConfigurablePaletteProvider'
import ConfigurableContextPadProvider from './ConfigurableContextPadProvider'
import ConfigurableCreateAppendMenuProvider from './ConfigurableCreateAppendMenuProvider'
import ConfigurableReplaceMenuProvider from './ConfigurableReplaceMenuProvider'
import DefaultUserTaskFormBehavior from './DefaultUserTaskFormBehavior'

export interface ConfigurableNodesConfig {
  isElementVisible: (type: string, eventDefinitionType?: string) => boolean
}

export default function createConfigurableNodesModule(config: ConfigurableNodesConfig) {
  return {
    __init__: ['createAppendMenuProvider', 'defaultUserTaskFormBehavior'],
    createAppendMenuProvider: ['type', ConfigurableCreateAppendMenuProvider],
    defaultUserTaskFormBehavior: ['type', DefaultUserTaskFormBehavior],
    configurableNodesConfig: ['value', config],
    paletteProvider: ['type', ConfigurablePaletteProvider],
    contextPadProvider: ['type', ConfigurableContextPadProvider],
    replaceMenuProvider: ['type', ConfigurableReplaceMenuProvider],
  }
}

export type { ElementName }
