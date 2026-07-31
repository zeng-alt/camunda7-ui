export function zoomIn(modeler: any) {
  if (!modeler) return
  const canvas = modeler.get('canvas')
  canvas.zoom(Math.min(canvas.zoom() * 1.2, 3.0), 'auto')
}

export function zoomOut(modeler: any) {
  if (!modeler) return
  const canvas = modeler.get('canvas')
  canvas.zoom(Math.max(canvas.zoom() / 1.2, 0.2), 'auto')
}

export function centerView(modeler: any) {
  if (!modeler) return
  modeler.get('canvas').zoom('fit-viewport')
}

export function undo(modeler: any) {
  if (!modeler) return
  const commandStack = modeler.get('commandStack')
  if (commandStack.canUndo()) commandStack.undo()
}

export function redo(modeler: any) {
  if (!modeler) return
  const commandStack = modeler.get('commandStack')
  if (commandStack.canRedo()) commandStack.redo()
}

export function toggleMinimap(modeler: any) {
  if (!modeler) return
  const minimap = modeler.get('minimap')
  if (minimap) minimap.toggle()
}
