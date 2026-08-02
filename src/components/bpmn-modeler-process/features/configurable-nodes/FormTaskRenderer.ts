import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer'
import { is } from 'bpmn-js/lib/util/ModelUtil'
import { append as svgAppend, attr as svgAttr, create as svgCreate } from 'tiny-svg'
import { getRoundRectPath, getFillColor, getStrokeColor } from 'bpmn-js/lib/draw/BpmnRenderUtil'
import { isFormTask } from '@/utils/bpmn'

const HIGH_PRIORITY = 1500
const TASK_BORDER_RADIUS = 8

const FORM_ICON_PATH =
  'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8zm2 16H8v-2h8zm0-4H8v-2h8zm-3-5V3.5L18.5 9z'

export default class FormTaskRenderer extends BaseRenderer {
  static $inject = ['eventBus', 'textRenderer']

  private _textRenderer: any

  constructor(eventBus: any, textRenderer: any) {
    super(eventBus, HIGH_PRIORITY)
    this._textRenderer = textRenderer
  }

  canRender(element: any): boolean {
    return is(element, 'bpmn:ServiceTask') && isFormTask(element.businessObject)
  }

  drawShape(visuals: any, element: any) {
    const { width, height } = element

    const fill = getFillColor(element)
    const stroke = getStrokeColor(element)

    const task = svgCreate('rect')
    svgAttr(task, {
      x: 0,
      y: 0,
      width,
      height,
      rx: TASK_BORDER_RADIUS,
      ry: TASK_BORDER_RADIUS,
      fill,
      stroke,
      strokeWidth: 2,
    })
    svgAppend(visuals, task)

    const iconSize = 22
    const scale = iconSize / 24
    const icon = svgCreate('path')
    svgAttr(icon, {
      d: FORM_ICON_PATH,
      transform: `translate(6, 6) scale(${scale})`,
      fill: getStrokeColor(element),
    })
    svgAppend(visuals, icon)

    // Render the element name centered in the node
    const name = element.businessObject?.name
    if (name) {
      const text = this._textRenderer.createText(name, {
        align: 'center-middle',
        box: { x: 0, y: 0, width, height },
        padding: 7,
        style: { fill: getStrokeColor(element) },
      })
      svgAppend(visuals, text)
    }

    return task
  }

  getShapePath(shape: any): string {
    return getRoundRectPath(shape, TASK_BORDER_RADIUS)
  }
}
