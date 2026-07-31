import { ref, type Ref } from 'vue'
import BpmnModeler from 'camunda-bpmn-js/lib/camunda-platform/Modeler'

export interface UseBpmnModelerOptions {
  container: () => HTMLElement | null
}

export interface UseBpmnModeler {
  modelerRef: Ref<any | null>
  init: (additionalModules?: any[]) => void
  getModeler: () => any | null
  loadDiagram: (xml: string) => Promise<void>
  importXml: (xml: string) => Promise<void>
  saveXml: () => Promise<string>
  clearCanvas: (emptyDiagram: string) => Promise<void>
  destroy: () => void
}

export function useBpmnModeler(options: UseBpmnModelerOptions): UseBpmnModeler {
  const modelerRef = ref<any | null>(null)
  let modeler: any = null

  function getModeler() {
    return modeler
  }

  function init(additionalModules: any[] = []) {
    const container = options.container()
    if (!container || modeler) return
    modeler = new BpmnModeler({ container, additionalModules })
    modelerRef.value = modeler
  }

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

  function setupColorManager() {
    if (!modeler) return
    const elementRegistry = modeler.get('elementRegistry')
    elementRegistry.forEach((el: any) => reapplyElementColor(el))
    modeler.on('element.changed', ({ element }: any) => reapplyElementColor(element))
  }

  function tryFitViewport(container: HTMLElement | null, attempts: number): void {
    if (!modeler) return
    if (container && container.clientWidth > 0 && container.clientHeight > 0) {
      modeler.get('canvas').zoom('fit-viewport')
    } else if (attempts < 10) {
      setTimeout(() => tryFitViewport(container, attempts + 1), 50)
    }
  }

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

  async function importXml(xml: string) {
    if (!modeler) return
    await modeler.importXML(xml)
  }

  async function saveXml(): Promise<string> {
    if (!modeler) return ''
    const { xml } = await modeler.saveXML({ format: true })
    return xml
  }

  async function clearCanvas(emptyDiagram: string) {
    if (!modeler) return
    try {
      await modeler.importXML(emptyDiagram)
      modeler.get('canvas').zoom('fit-viewport')
    } catch (err) {
      console.error('Error clearing canvas', err)
    }
  }

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
