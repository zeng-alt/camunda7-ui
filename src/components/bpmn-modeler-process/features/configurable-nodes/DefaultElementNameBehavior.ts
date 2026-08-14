import type { ConfigurableNodesConfig } from './createConfigurableNodesModule'

/**
 * 为新建 / 修改生成的节点元素填充默认名称。
 *
 * 监听命令栈的 shape.create 与 shape.replace，当目标元素尚未设置名称时，
 * 通过配置的 getDefaultElementName 计算本地化默认名称（按当前语言返回
 * 元素类型名，如 开始事件 / Start Event）并写入。仅作用于节点类元素，
 * 顺序流 / 关联等连线不在此列。
 */
export default class DefaultElementNameBehavior {
  static $inject = ['eventBus', 'configurableNodesConfig']

  private config: ConfigurableNodesConfig

  constructor(eventBus: any, config: ConfigurableNodesConfig) {
    this.config = config

    eventBus.on('commandStack.shape.create.executed', (event: any) => {
      this.applyDefaultName(event?.context?.shape)
    })

    eventBus.on('commandStack.shape.replace.executed', (event: any) => {
      this.applyDefaultName(event?.context?.newShape)
    })
  }

  private applyDefaultName(shape: any) {
    const bo = shape?.businessObject
    if (!bo) return
    const name = bo.name
    if (name !== undefined && name !== null && String(name).trim() !== '') return
    const defaultName = this.config.getDefaultElementName?.(bo) || ''
    if (!defaultName) return
    bo.name = defaultName
  }
}
