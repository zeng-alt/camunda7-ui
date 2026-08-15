import type { ConfigurableNodesConfig } from './createConfigurableNodesModule'

const DEFAULT_INITIATOR = 'initiator'

/**
 * 为新建 / 修改为的开始事件填充发起人默认值（camunda:initiator）。
 *
 * 监听命令栈的 shape.create 与 shape.replace，当目标元素为 bpmn:StartEvent 且
 * 尚未设置发起人时，写入配置的默认值（默认 initiator）。仅在创建 / 替换时
 * 生效，用户后续手动修改过的值不会被覆盖。
 */
export default class StartEventInitiatorBehavior {
  static $inject = ['eventBus', 'configurableNodesConfig']

  private config: ConfigurableNodesConfig

  constructor(eventBus: any, config: ConfigurableNodesConfig) {
    this.config = config

    eventBus.on('commandStack.shape.create.executed', (event: any) => {
      this.applyInitiator(event?.context?.shape)
    })

    eventBus.on('commandStack.shape.replace.executed', (event: any) => {
      this.applyInitiator(event?.context?.newShape)
    })
  }

  private applyInitiator(shape: any) {
    const bo = shape?.businessObject
    if (!bo || bo.$type !== 'bpmn:StartEvent') return
    if (bo.initiator === undefined || bo.initiator === null || bo.initiator === '') {
      bo.initiator = this.config.startEventInitiator ?? DEFAULT_INITIATOR
    }
  }
}
