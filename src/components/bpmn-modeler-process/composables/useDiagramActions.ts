/** 放大画布（1.2 倍，上限 3.0） */
export function zoomIn(modeler: any) {
  if (!modeler) return
  const canvas = modeler.get('canvas')
  canvas.zoom(Math.min(canvas.zoom() * 1.2, 3.0), 'auto')
}

/** 缩小画布（1.2 倍，下限 0.2） */
export function zoomOut(modeler: any) {
  if (!modeler) return
  const canvas = modeler.get('canvas')
  canvas.zoom(Math.max(canvas.zoom() / 1.2, 0.2), 'auto')
}

/** 自适应居中显示整个图 */
export function centerView(modeler: any) {
  if (!modeler) return
  modeler.get('canvas').zoom('fit-viewport')
}

/** 撤销上一步操作 */
export function undo(modeler: any) {
  if (!modeler) return
  const commandStack = modeler.get('commandStack')
  if (commandStack.canUndo()) commandStack.undo()
}

/** 重做被撤销的操作 */
export function redo(modeler: any) {
  if (!modeler) return
  const commandStack = modeler.get('commandStack')
  if (commandStack.canRedo()) commandStack.redo()
}

/** 切换迷你地图的显示/隐藏 */
export function toggleMinimap(modeler: any) {
  if (!modeler) return
  const minimap = modeler.get('minimap')
  if (minimap) minimap.toggle()
}
