export function uid(): string {
  return `ed_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

export function getDefinitions(bo: any): any {
  let cur = bo
  while (cur) {
    if (cur.$type === 'bpmn:Definitions') return cur
    cur = cur.$parent
  }
  return null
}
