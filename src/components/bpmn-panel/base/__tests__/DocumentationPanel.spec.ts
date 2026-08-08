import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import DocumentationPanel from '../DocumentationPanel'

function createMocks() {
  const updateProperties = vi.fn()
  const create = vi.fn((type: string, attrs: any) => ({ $type: type, ...attrs }))
  const modeler = {
    get: (name: string) => {
      if (name === 'modeling') return { updateProperties }
      if (name === 'moddle') return { create }
      return null
    },
  }
  return { updateProperties, create, modeler }
}

function mountPanel(bo: any, modeler: any) {
  return mount(DocumentationPanel, {
    props: { businessObject: bo, element: { businessObject: bo }, bpmnModeler: modeler },
  })
}

function textareaValue(wrapper: ReturnType<typeof mount>) {
  const textarea = wrapper.find('textarea')
  return textarea.exists() ? (textarea.element as HTMLTextAreaElement).value : null
}

describe('DocumentationPanel', () => {
  it('renders the documentation text of the business object', () => {
    const { modeler } = createMocks()
    const bo = { $type: 'bpmn:Task', documentation: [{ text: 'hello docs' }] }
    expect(textareaValue(mountPanel(bo, modeler))).toBe('hello docs')
  })

  it('shows an empty textarea when there is no documentation', () => {
    const { modeler } = createMocks()
    expect(textareaValue(mountPanel({ $type: 'bpmn:Task', documentation: [] }, modeler))).toBe('')
    expect(textareaValue(mountPanel({ $type: 'bpmn:Task' }, modeler))).toBe('')
  })

  it('renders nothing without a business object', () => {
    const { modeler } = createMocks()
    const wrapper = mount(DocumentationPanel, {
      props: { businessObject: null, element: null, bpmnModeler: modeler },
    })
    expect(wrapper.find('textarea').exists()).toBe(false)
  })

  it('creates a bpmn:Documentation element and updates the model on input', async () => {
    const { modeler, create, updateProperties } = createMocks()
    const bo = { $type: 'bpmn:Task', documentation: [] }
    const wrapper = mountPanel(bo, modeler)

    await wrapper.find('textarea').setValue('new docs')

    expect(create).toHaveBeenCalledWith('bpmn:Documentation', { text: 'new docs' })
    expect(updateProperties).toHaveBeenCalledWith(
      { businessObject: bo },
      {
        documentation: [expect.objectContaining({ $type: 'bpmn:Documentation', text: 'new docs' })],
      },
    )
  })
})
