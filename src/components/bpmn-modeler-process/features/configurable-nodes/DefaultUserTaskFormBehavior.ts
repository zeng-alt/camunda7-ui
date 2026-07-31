export default class DefaultUserTaskFormBehavior {
  static $inject = ['eventBus', 'moddle']

  constructor(eventBus: any, moddle: any) {
    eventBus.on('commandStack.shape.create.executed', (event: any) => {
      const businessObject = event.context?.shape?.businessObject
      if (!businessObject || businessObject.$type !== 'bpmn:UserTask') return
      if (hasFormData(businessObject)) return
      attachDefaultUserTaskForm(moddle, businessObject)
    })
  }
}

function hasFormData(businessObject: any): boolean {
  return (
    businessObject.extensionElements?.values?.some(
      (value: any) => value.$type === 'camunda:FormData',
    ) ?? false
  )
}

function attachDefaultUserTaskForm(moddle: any, businessObject: any) {
  const formField = moddle.create('camunda:FormField', {
    id: 'agree',
    label: '同意',
    type: 'boolean',
    defaultValue: 'true',
  })
  const formData = moddle.create('camunda:FormData', { fields: [formField] })

  if (businessObject.extensionElements) {
    businessObject.extensionElements.values.push(formData)
  } else {
    businessObject.extensionElements = moddle.create('bpmn:ExtensionElements', {
      values: [formData],
    })
  }
}
