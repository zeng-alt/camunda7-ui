import { defineComponent, ref, onBeforeUnmount, watch, toRaw, type PropType } from 'vue'
import { useCamundaI18n } from '../../locales'
import { getElementType, getTypeIcon, eventSubTypes } from '@/utils/bpmn'
import ProcessPropertiesPanel from './ProcessPropertiesPanel'
import {
  EventPropertiesPanel,
  getEventIcon,
  getEventDefType,
  getEventDefLabelKey,
  getCategoryLabelKey,
} from './events'
import { TaskPropertiesPanel } from './task'
import { GatewayPropertiesPanel } from './gateways'
import { CallActivityPropertiesPanel } from './call-activity'
import { FlowPropertiesPanel } from './flow'
import { SubProcessPropertiesPanel } from './subprocess'
import { GroupPropertiesPanel } from './group'
import { TextAnnotationPropertiesPanel } from './text-annotation'
import { AssociationPropertiesPanel } from './association'
import { DataObjectReferencePropertiesPanel, DataStoreReferencePropertiesPanel } from './data'
import { PoolPropertiesPanel, LanePropertiesPanel, CollaborationPropertiesPanel } from './swimlanes'

function isDefaultFlow(sequenceFlow: any) {
  const source = sequenceFlow.source
  if (!source) return false
  const bo = source.businessObject
  return bo.default && bo.default.id === sequenceFlow.id
}

function isConditionalFlow(sequenceFlow: any) {
  const bo = sequenceFlow.businessObject
  return !!bo?.conditionExpression
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

const eventTypes = eventSubTypes

const taskTypes = new Set([
  'user-task',
  'service-task',
  'send-task',
  'receive-task',
  'manual-task',
  'script-task',
  'business-rule-task',
  'task',
])

const callActivityTypes = new Set(['call-activity'])

const subProcessTypes = new Set(['sub-process', 'ad-hoc-sub-process', 'transaction'])

const swimlaneTypes = new Set(['participant', 'lane'])

const gatewayTypes = new Set([
  'exclusive-gateway',
  'parallel-gateway',
  'inclusive-gateway',
  'event-based-gateway',
  'gateway',
])

const flowTypes = new Set(['sequence-flow'])

const artifactTypes = new Set(['text-annotation', 'group', 'association'])

const dataTypes = new Set(['data-object-reference', 'data-store-reference'])

export interface CamundaPropertiesPanelProps {
  /** bpmn-js 模型器实例：用于监听选中元素并读写模型属性 */
  bpmnModeler?: Record<string, any>
  /** 属性表单尺寸：small / medium / large */
  formSize?: 'small' | 'medium' | 'large'
  /** 标签位置：left（左侧）/ top（顶部） */
  labelPlacement?: 'left' | 'top'
  /** 额外 tab 内容映射：{ 元素类型: Vue 组件 }，用于为指定节点追加属性 tab */
  extraTabs?: Record<string, any>
  /** 额外 tab 的标签文本映射：{ 元素类型: 自定义标签 } */
  extraTabLabels?: Record<string, string>
  /** 用户解析器表达式：用于解析办理人/候选人的 JS 表达式 */
  userResolver?: string
  /** 用户组解析器表达式：用于解析候选用户组的 JS 表达式 */
  groupResolver?: string
}

export default defineComponent<CamundaPropertiesPanelProps>({
  name: 'CamundaPropertiesPanel',
  props: {
    /** bpmn-js 模型器实例：用于监听选中元素并读写模型属性 */
    bpmnModeler: {
      type: Object,
      default: null,
    },
    /** 属性表单尺寸：small / medium / large */
    formSize: {
      type: String as PropType<'small' | 'medium' | 'large'>,
      default: 'small',
    },
    /** 标签位置：left（左侧）/ top（顶部） */
    labelPlacement: {
      type: String as PropType<'left' | 'top'>,
      default: 'top',
    },
    /** 额外 tab 内容映射：{ 元素类型: Vue 组件 }，用于为指定节点追加属性 tab */
    extraTabs: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({}),
    },
    /** 额外 tab 的标签文本映射：{ 元素类型: 自定义标签 } */
    extraTabLabels: {
      type: Object as PropType<Record<string, string>>,
      default: () => ({}),
    },
    /** 用户解析器表达式：用于解析办理人/候选人的 JS 表达式 */
    userResolver: {
      type: String,
      default: 'approverResolver.getUsers',
    },
    /** 用户组解析器表达式：用于解析候选用户组的 JS 表达式 */
    groupResolver: {
      type: String,
      default: 'approverResolver.getUserGroups',
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
      const element = event.element
      const selected = toRaw(selectedElement.value)
      if (element === selected || element === selected?.source) {
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

      const isDefault =
        type === 'sequence-flow' && selectedElement.value
          ? isDefaultFlow(selectedElement.value)
          : false
      const isConditional =
        type === 'sequence-flow' && selectedElement.value
          ? isConditionalFlow(selectedElement.value)
          : false
      const elementName = selectedBusinessObject.value?.name
      const isEvent = eventTypes.has(type)

      let typeLabel: string
      let iconClass: string

      if (isDefault) {
        typeLabel = t('bpmnPanel.types.default-flow')
        iconClass = 'bpmn-icon-default-flow'
      } else if (isConditional) {
        typeLabel = t('bpmnPanel.types.conditional-flow')
        iconClass = 'bpmn-icon-conditional-flow'
      } else if (isEvent) {
        const defType = getEventDefType(selectedBusinessObject.value)
        const categoryKey = getCategoryLabelKey(type)
        const categoryLabel = t(categoryKey)
        const defLabelKey = getEventDefLabelKey(defType)
        const defLabel = t(defLabelKey)
        typeLabel = defType === 'none' ? categoryLabel : `${categoryLabel} > ${defLabel}`
        iconClass = getEventIcon(type, selectedBusinessObject.value)
      } else {
        typeLabel = t(`bpmnPanel.types.${type}`)
        iconClass = getTypeIcon(type)
      }

      const common = {
        businessObject: selectedBusinessObject.value,
        element: selectedElement.value,
        bpmnModeler: props.bpmnModeler,
        formSize: props.formSize,
        labelPlacement: props.labelPlacement,
      }

      const renderPanel = (() => {
        if (type === 'collaboration') {
          return () => <CollaborationPropertiesPanel {...common} />
        }
        if (type === 'process') {
          return () => <ProcessPropertiesPanel {...common} />
        }
        if (eventTypes.has(type)) {
          return () => (
            <EventPropertiesPanel
              {...common}
              extraTabContent={props.extraTabs?.[type]}
              extraTabLabel={props.extraTabLabels?.[type] || ''}
            />
          )
        }
        if (subProcessTypes.has(type)) {
          return () => (
            <SubProcessPropertiesPanel
              {...common}
              userResolver={props.userResolver}
              groupResolver={props.groupResolver}
            />
          )
        }
        if (callActivityTypes.has(type)) {
          return () => (
            <CallActivityPropertiesPanel
              {...common}
              userResolver={props.userResolver}
              groupResolver={props.groupResolver}
            />
          )
        }
        if (taskTypes.has(type)) {
          return () => (
            <TaskPropertiesPanel
              {...common}
              extraTabContent={props.extraTabs?.['task']}
              extraTabLabel={props.extraTabLabels?.['task'] || ''}
              userResolver={props.userResolver}
              groupResolver={props.groupResolver}
            />
          )
        }
        if (flowTypes.has(type)) {
          return () => <FlowPropertiesPanel {...common} />
        }
        if (dataTypes.has(type)) {
          return type === 'data-object-reference'
            ? () => <DataObjectReferencePropertiesPanel {...common} />
            : () => <DataStoreReferencePropertiesPanel {...common} />
        }
        if (artifactTypes.has(type)) {
          if (type === 'group') return () => <GroupPropertiesPanel {...common} />
          if (type === 'text-annotation') {
            return () => <TextAnnotationPropertiesPanel {...common} />
          }
          return () => <AssociationPropertiesPanel {...common} />
        }
        if (swimlaneTypes.has(type)) {
          return type === 'lane'
            ? () => <LanePropertiesPanel {...common} />
            : () => <PoolPropertiesPanel {...common} />
        }
        if (gatewayTypes.has(type)) {
          return () => (
            <GatewayPropertiesPanel
              {...common}
              extraTabContent={props.extraTabs?.['gateway']}
              extraTabLabel={props.extraTabLabels?.['gateway'] || ''}
            />
          )
        }
        return null
      })()

      return (
        <>
          <div class="h-full flex flex-col">
            <div
              class={`flex gap-12px p-12px border-b border-solid border-light_border dark:border-dark_border ${elementName ? 'items-start' : 'items-center'}`}
            >
              <i class={`${iconClass} text-24px`} />
              <div class="flex-1 min-w-0">
                <div class="text-14px font-bold truncate">{typeLabel}</div>
                {elementName && <div class="text-12px text-#888 truncate">{elementName}</div>}
              </div>
            </div>
            <div class="flex-1 overflow-auto camunda-props-scroll pb-16px">
              {renderPanel ? (
                renderPanel()
              ) : (
                <div class="flex items-center justify-center h-full text-#888 text-13px">
                  <p>
                    {typeLabel} {t('bpmnPanel.panel.comingSoon')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )
    }
  },
})
