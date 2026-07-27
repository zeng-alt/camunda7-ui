import { defineComponent, ref, onBeforeUnmount, watch, type PropType } from 'vue'
import { useCamundaI18n } from '../../locales'
import ProcessPropertiesPancel from './ProcessPropertiesPancel'
import { EventPropertiesPanel } from './events'
import { TaskPropertiesPanel } from './task'
import { GatewayPropertiesPanel } from './gateways'
import { CallActivityPropertiesPanel } from './callactivity'
import { FlowPropertiesPanel } from './flow'

function isDefaultFlow(sequenceFlow: any) {
  const source = sequenceFlow.source
  if (!source) return false
  const bo = source.businessObject
  return bo.default && bo.default.id === sequenceFlow.id
}

function getElementType(element: any): string {
  if (!element || !element.businessObject) return ''
  const type: string = element.businessObject.$type || ''
  if (type.includes('Process')) return 'process'
  if (type.includes('StartEvent')) return 'start-event'
  if (type.includes('EndEvent')) return 'end-event'
  if (type.includes('IntermediateThrowEvent')) return 'intermediate-throw-event'
  if (type.includes('IntermediateCatchEvent')) return 'intermediate-catch-event'
  if (type.includes('BoundaryEvent')) return 'boundary-event'
  if (type.includes('UserTask')) return 'user-task'
  if (type.includes('ServiceTask')) return 'service-task'
  if (type.includes('ScriptTask')) return 'script-task'
  if (type.includes('BusinessRuleTask')) return 'business-rule-task'
  if (type.includes('CallActivity')) return 'call-activity'
  if (type.includes('Task')) return 'task'
  if (type.includes('ExclusiveGateway')) return 'exclusive-gateway'
  if (type.includes('ParallelGateway')) return 'parallel-gateway'
  if (type.includes('InclusiveGateway')) return 'inclusive-gateway'
  if (type.includes('EventBasedGateway')) return 'event-based-gateway'
  if (type.includes('Gateway')) return 'gateway'
  if (type.includes('SequenceFlow')) return 'sequence-flow'
  if (type.includes('Participant')) return 'participant'
  if (type.includes('Lane')) return 'lane'
  if (type.includes('TextAnnotation')) return 'text-annotation'
  if (type.includes('Group')) return 'group'
  return 'unknown'
}

const eventTypes = new Set([
  'start-event', 'end-event', 'intermediate-throw-event',
  'intermediate-catch-event', 'boundary-event',
])

const taskTypes = new Set([
  'user-task', 'service-task', 'script-task',
  'business-rule-task', 'task',
])

const callActivityTypes = new Set([
  'call-activity',
])

const gatewayTypes = new Set([
  'exclusive-gateway', 'parallel-gateway', 'inclusive-gateway',
  'event-based-gateway', 'gateway',
])

const flowTypes = new Set([
  'sequence-flow',
])

const typeIconMap: Record<string, string> = {
  process: 'bpmn-icon-bpmn-io',
  'start-event': 'bpmn-icon-start-event-none',
  'end-event': 'bpmn-icon-end-event-none',
  'intermediate-throw-event': 'bpmn-icon-intermediate-event-none',
  'intermediate-catch-event': 'bpmn-icon-intermediate-event-none',
  'boundary-event': 'bpmn-icon-intermediate-event-catch-timer',
  'user-task': 'bpmn-icon-user-task',
  'service-task': 'bpmn-icon-service-task',
  'script-task': 'bpmn-icon-script-task',
  'business-rule-task': 'bpmn-icon-business-rule-task',
  'call-activity': 'bpmn-icon-call-activity',
  task: 'bpmn-icon-task',
  'exclusive-gateway': 'bpmn-icon-gateway-xor',
  'parallel-gateway': 'bpmn-icon-gateway-parallel',
  'inclusive-gateway': 'bpmn-icon-gateway-or',
  'event-based-gateway': 'bpmn-icon-gateway-eventbased',
  'gateway': 'bpmn-icon-gateway-complex',
  'sequence-flow': 'bpmn-icon-connection',
  participant: 'bpmn-icon-participant',
  lane: 'bpmn-icon-lane',
  'text-annotation': 'bpmn-icon-text-annotation',
  group: 'bpmn-icon-group',
  unknown: 'bpmn-icon-screw-wrench',
}

function getTypeIcon(type: string): string {
  return typeIconMap[type] || 'bpmn-icon-screw-wrench'
}

function showRootProcess(modeler: any) {
  const canvas = modeler.get('canvas')
  const root = canvas.getRootElement()
  if (root) {
    return {
      element: root,
      businessObject: root.businessObject,
      elementType: getElementType(root),
    }
  }
  return null
}

export default defineComponent({
  name: 'CamundaPropertiesPanel',
  props: {
    bpmnModeler: {
      type: Object,
      default: null,
    },
    formSize: {
      type: String as PropType<'small' | 'medium' | 'large'>,
      default: 'small',
    },
    labelPlacement: {
      type: String as PropType<'left' | 'top'>,
      default: 'left',
    },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const selectedElement = ref<any>(null)
    const selectedBusinessObject = ref<any>(null)
    const elementType = ref<string>('')
    const updateKey = ref(0)
    let modeler: any = null
    let eventBus: any = null
    let initialized = false

    function handleSelectionChange(event: any) {
      const selection = event.newSelection || []
      const element = selection[0]
      if (element) {
        selectedElement.value = element
        selectedBusinessObject.value = element.businessObject
        elementType.value = getElementType(element)
      } else if (modeler) {
        const rootData = showRootProcess(modeler)
        if (rootData) {
          selectedElement.value = rootData.element
          selectedBusinessObject.value = rootData.businessObject
          elementType.value = rootData.elementType
        }
      }
    }

    function handleRootAdded(event: any) {
      const element = event.element
      if (element) {
        selectedElement.value = element
        selectedBusinessObject.value = element.businessObject
        elementType.value = getElementType(element)
      }
    }

    function handleElementChanged(event: any) {
      if (event.element === selectedElement.value) {
        updateKey.value++
      }
    }

    function initModeler(m: any) {
      if (initialized || !m) return
      initialized = true
      modeler = m

      eventBus = m.get('eventBus')
      eventBus.on('selection.changed', handleSelectionChange)
      eventBus.on('root.added', handleRootAdded)
      eventBus.on('element.changed', handleElementChanged)

      const selection = m.get('selection')
      const currentSelection = selection.get()
      if (currentSelection && currentSelection.length > 0) {
        const element = currentSelection[0]
        selectedElement.value = element
        selectedBusinessObject.value = element.businessObject
        elementType.value = getElementType(element)
      } else {
        const rootData = showRootProcess(m)
        if (rootData) {
          selectedElement.value = rootData.element
          selectedBusinessObject.value = rootData.businessObject
          elementType.value = rootData.elementType
        }
      }
    }

    watch(() => props.bpmnModeler, initModeler, { immediate: true })

    onBeforeUnmount(() => {
      if (eventBus) {
        eventBus.off('selection.changed', handleSelectionChange)
        eventBus.off('root.added', handleRootAdded)
        eventBus.off('element.changed', handleElementChanged)
      }
    })

    return () => {
      const type = elementType.value
      updateKey.value

      if (!type) {
        return (
          <div class="flex items-center justify-center h-full text-#888 text-13px">
            <p>{t('bpmnPanel.panel.noSelection')}</p>
          </div>
        )
      }

      const isDefault = type === 'sequence-flow' && selectedElement.value ? isDefaultFlow(selectedElement.value) : false
      const typeLabel = isDefault ? t('bpmnPanel.types.default-flow') : t(`bpmnPanel.types.${type}`)
      const elementName = selectedBusinessObject.value?.name
      const iconClass = isDefault ? 'bpmn-icon-default-flow' : getTypeIcon(type)

      return (
        <div class="h-full flex flex-col">
          <div class={`flex gap-12px p-12px border-b border-solid border-light_border dark:border-dark_border ${elementName ? 'items-start' : 'items-center'}`}>
            <i class={`${iconClass} text-24px`} />
            <div class="flex-1 min-w-0">
              <div class="text-14px font-bold truncate">{typeLabel}</div>
              {elementName && (
                <div class="text-12px text-#888 truncate">{elementName}</div>
              )}
            </div>
          </div>
          <div class="flex-1 overflow-auto">
            {type === 'process' ? (
              <ProcessPropertiesPancel
                businessObject={selectedBusinessObject.value}
                element={selectedElement.value}
                bpmnModeler={props.bpmnModeler}
                formSize={props.formSize}
                labelPlacement={props.labelPlacement}
              />
            ) : eventTypes.has(type) ? (
              <EventPropertiesPanel
                businessObject={selectedBusinessObject.value}
                element={selectedElement.value}
                bpmnModeler={props.bpmnModeler}
                formSize={props.formSize}
                labelPlacement={props.labelPlacement}
              />
            ) : taskTypes.has(type) ? (
              <TaskPropertiesPanel
                businessObject={selectedBusinessObject.value}
                element={selectedElement.value}
                bpmnModeler={props.bpmnModeler}
                formSize={props.formSize}
                labelPlacement={props.labelPlacement}
              />
            ) : flowTypes.has(type) ? (
              <FlowPropertiesPanel
                businessObject={selectedBusinessObject.value}
                element={selectedElement.value}
                bpmnModeler={props.bpmnModeler}
                formSize={props.formSize}
                labelPlacement={props.labelPlacement}
              />
            ) : gatewayTypes.has(type) ? (
              <GatewayPropertiesPanel
                businessObject={selectedBusinessObject.value}
                element={selectedElement.value}
                bpmnModeler={props.bpmnModeler}
                formSize={props.formSize}
                labelPlacement={props.labelPlacement}
              />
            ) : (
              <div class="flex items-center justify-center h-full text-#888 text-13px">
                <p>{typeLabel} {t('bpmnPanel.panel.comingSoon')}</p>
              </div>
            )}
          </div>
        </div>
      )
    }
  },
})
