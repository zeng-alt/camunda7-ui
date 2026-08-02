export const FORM_TASK_TEMPLATE = 'camunda7-ui:form-task'

/** 新创建的表单任务默认委托表达式 */
export const FORM_TASK_DELEGATE_EXPRESSION = '${formkService}'

/**
 * Extracts the modelerTemplate value from a BPMN business object.
 * Returns the template ID string, or null if no template is set.
 *
 * @example
 * const template = getModelerTemplate(businessObject) // e.g. 'camunda7-ui:form-task'
 */
export function getModelerTemplate(businessObject: any): string | null {
  if (!businessObject || typeof businessObject.get !== 'function') return null
  return businessObject.get('modelerTemplate') || null
}

export function isFormTask(businessObject: any): boolean {
  return getModelerTemplate(businessObject) === FORM_TASK_TEMPLATE
}
