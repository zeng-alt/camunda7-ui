import type { ElementName } from '@/components/bpmn-panel/designerConfig'
import type { ActionTarget } from '@/utils/bpmn'
import ConfigurablePaletteProvider from './ConfigurablePaletteProvider'
import ConfigurableContextPadProvider from './ConfigurableContextPadProvider'
import ConfigurableCreateAppendMenuProvider from './ConfigurableCreateAppendMenuProvider'
import ConfigurableReplaceMenuProvider from './ConfigurableReplaceMenuProvider'
import DefaultUserTaskFormBehavior from './DefaultUserTaskFormBehavior'
import FormTaskRenderer from './FormTaskRenderer'
import DefaultElementNameBehavior from './DefaultElementNameBehavior'
import StartEventInitiatorBehavior from './StartEventInitiatorBehavior'

export interface ConfigurableNodesConfig {
  isElementVisible: (target: ActionTarget) => boolean
  /** 返回元素类型的本地化默认名称；返回空字符串表示不设置名称 */
  getDefaultElementName?: (businessObject: any) => string
  /** 新建 / 修改为开始事件时自动填充的发起人默认值，默认 initiator */
  startEventInitiator?: string
}

export default function createConfigurableNodesModule(config: ConfigurableNodesConfig) {
  return {
    __init__: [
      'createAppendMenuProvider',
      'defaultUserTaskFormBehavior',
      'formTaskRenderer',
      'defaultElementNameBehavior',
      'startEventInitiatorBehavior',
    ],
    createAppendMenuProvider: ['type', ConfigurableCreateAppendMenuProvider],
    defaultUserTaskFormBehavior: ['type', DefaultUserTaskFormBehavior],
    configurableNodesConfig: ['value', config],
    paletteProvider: ['type', ConfigurablePaletteProvider],
    contextPadProvider: ['type', ConfigurableContextPadProvider],
    replaceMenuProvider: ['type', ConfigurableReplaceMenuProvider],
    formTaskRenderer: ['type', FormTaskRenderer],
    defaultElementNameBehavior: ['type', DefaultElementNameBehavior],
    startEventInitiatorBehavior: ['type', StartEventInitiatorBehavior],
  }
}

export type { ElementName }
