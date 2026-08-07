declare module 'bpmn-js-bpmnlint' {
  const lintModule: any
  export default lintModule
}

declare module 'bpmnlint/rules/*' {
  const factory: (config?: any) => any
  export default factory
}
