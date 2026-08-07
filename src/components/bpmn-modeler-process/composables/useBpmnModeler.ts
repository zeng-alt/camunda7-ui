import { ref, type Ref } from 'vue'
import BpmnModeler from 'camunda-bpmn-js/lib/camunda-platform/Modeler'
import lintModule from 'bpmn-js-bpmnlint'
import { linterConfig } from '@/lint'

/** useBpmnModeler 的配置选项 */
export interface UseBpmnModelerOptions {
  /** 返回画布容器 DOM 元素的函数 */
  container: () => HTMLElement | null
  /** 是否启用 bpmnlint（画布标记 + 属性面板 Lint Tab），默认 true */
  linting?: boolean
}

/** useBpmnModeler 的返回值：建模器实例与生命周期方法 */
export interface UseBpmnModeler {
  /** 响应式建模器引用（用于模板 / 传递） */
  modelerRef: Ref<any | null>
  /** 初始化建模器（可附加自定义模块） */
  init: (additionalModules?: any[]) => void
  /** 获取建模器实例（非响应式） */
  getModeler: () => any | null
  /** 导入 XML 并重建颜色、自适应视口 */
  loadDiagram: (xml: string) => Promise<void>
  /** 直接导入 XML，不做额外处理 */
  importXml: (xml: string) => Promise<void>
  /** 导出格式化后的 XML 字符串 */
  saveXml: () => Promise<string>
  /** 用空图清空画布并自适应视口 */
  clearCanvas: (emptyDiagram: string) => Promise<void>
  /** 销毁建模器实例 */
  destroy: () => void
}

/**
 * @description 管理 BPMN 建模器实例的生命周期。
 *
 * 提供初始化、XML 导入导出、画布清空、销毁等能力，并在导入后
 * 自动重建元素着色（background / border）与自适应视口。
 *
 * ## 基本用法
 *
 * ```ts
 * const { init, loadDiagram, saveXml, destroy } = useBpmnModeler({
 *   container: () => canvasRef.value,
 * })
 *
 * init()
 * await loadDiagram(xml)
 * const xml = await saveXml()
 * ```
 *
 * @param options 配置选项，见 {@link UseBpmnModelerOptions}
 * @returns 建模器实例与生命周期方法，见 {@link UseBpmnModeler}
 */
export function useBpmnModeler(options: UseBpmnModelerOptions): UseBpmnModeler {
  const modelerRef = ref<any | null>(null)
  let modeler: any = null

  function getModeler() {
    return modeler
  }

  function init(additionalModules: any[] = []) {
    const container = options.container()
    if (!container || modeler) return
    const lintingEnabled = options.linting !== false
    const modules = lintingEnabled ? [lintModule, ...additionalModules] : additionalModules
    modeler = new BpmnModeler({
      container,
      linting: lintingEnabled ? { bpmnlint: linterConfig, active: true } : undefined,
      additionalModules: modules,
    })
    modelerRef.value = modeler
  }

  /** 重新为元素应用背景色/描边色 */
  function reapplyElementColor(element: any) {
    if (!modeler) return
    const di = element.di
    if (!di) return
    const fill = di.get('color:background-color') || di.get('bioc:fill') || (di as any).fill
    const stroke = di.get('color:border-color') || di.get('bioc:stroke') || (di as any).stroke
    if (!fill && !stroke) return
    const elementRegistry = modeler.get('elementRegistry')
    const gfx = elementRegistry.getGraphics(element) as SVGElement | null
    if (!gfx) return
    const sel = '.djs-visual > :is(rect, circle, polygon, ellipse, path)'
    const visual = gfx.querySelector(sel) as SVGElement | null
    if (visual) {
      if (fill) visual.style.setProperty('fill', fill, 'important')
      if (stroke) visual.style.setProperty('stroke', stroke, 'important')
    }
  }

  /** 注册元素颜色管理，监听 element.changed 保持着色 */
  function setupColorManager() {
    if (!modeler) return
    const elementRegistry = modeler.get('elementRegistry')
    elementRegistry.forEach((el: any) => reapplyElementColor(el))
    modeler.on('element.changed', ({ element }: any) => reapplyElementColor(element))
  }

  /** 容器就绪前重试自适应视口，最多 10 次 */
  function tryFitViewport(container: HTMLElement | null, attempts: number): void {
    if (!modeler) return
    if (container && container.clientWidth > 0 && container.clientHeight > 0) {
      modeler.get('canvas').zoom('fit-viewport')
    } else if (attempts < 10) {
      setTimeout(() => tryFitViewport(container, attempts + 1), 50)
    }
  }

  /** 导入 XML 并重建颜色、自适应视口 */
  async function loadDiagram(xml: string) {
    if (!modeler) return
    try {
      await modeler.importXML(xml)
      setupColorManager()
      tryFitViewport(options.container(), 0)
    } catch (err) {
      console.error('something went wrong:', err)
    }
  }

  /** 直接导入 XML，不做额外处理 */
  async function importXml(xml: string) {
    if (!modeler) return
    await modeler.importXML(xml)
  }

  /** 导出格式化后的 XML 字符串 */
  async function saveXml(): Promise<string> {
    if (!modeler) return ''
    const { xml } = await modeler.saveXML({ format: true })
    return xml
  }

  /** 用空图清空画布并自适应视口 */
  async function clearCanvas(emptyDiagram: string) {
    if (!modeler) return
    try {
      await modeler.importXML(emptyDiagram)
      modeler.get('canvas').zoom('fit-viewport')
    } catch (err) {
      console.error('Error clearing canvas', err)
    }
  }

  /** 销毁建模器实例 */
  function destroy() {
    if (modeler) {
      modeler.destroy()
      modeler = null
      modelerRef.value = null
    }
  }

  return {
    modelerRef,
    init,
    getModeler,
    loadDiagram,
    importXml,
    saveXml,
    clearCanvas,
    destroy,
  }
}
