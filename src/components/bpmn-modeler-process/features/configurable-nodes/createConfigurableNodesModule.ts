import type { ElementName } from '@/components/bpmn-panel/designerConfig'
import type { ActionTarget } from '@/utils/bpmn'
import ConfigurablePaletteProvider from './ConfigurablePaletteProvider'
import ConfigurableContextPadProvider from './ConfigurableContextPadProvider'
import ConfigurableCreateAppendMenuProvider from './ConfigurableCreateAppendMenuProvider'
import ConfigurableReplaceMenuProvider from './ConfigurableReplaceMenuProvider'
import DefaultUserTaskFormBehavior from './DefaultUserTaskFormBehavior'
import FormTaskRenderer from './FormTaskRenderer'

export interface ConfigurableNodesConfig {
  isElementVisible: (target: ActionTarget) => boolean
}

export default function createConfigurableNodesModule(config: ConfigurableNodesConfig) {
  return {
    __init__: ['createAppendMenuProvider', 'defaultUserTaskFormBehavior', 'formTaskRenderer'],
    createAppendMenuProvider: ['type', ConfigurableCreateAppendMenuProvider],
    defaultUserTaskFormBehavior: ['type', DefaultUserTaskFormBehavior],
    configurableNodesConfig: ['value', config],
    paletteProvider: ['type', ConfigurablePaletteProvider],
    contextPadProvider: ['type', ConfigurableContextPadProvider],
    replaceMenuProvider: ['type', ConfigurableReplaceMenuProvider],
    formTaskRenderer: ['type', FormTaskRenderer],
  }
}

export type { ElementName }
