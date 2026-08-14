import { defineComponent, ref, onBeforeUnmount, watch, toRaw, type PropType } from 'vue'
import { useCamundaI18n } from '../../locales'
import {
  getElementType,
  getTypeIcon,
  getModelerTemplate,
  registerTemplateTypes,
  eventSubTypes,
} from '@/utils/bpmn'
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
import { FlowPropertiesPanel, MessageFlowPropertiesPanel } from './flow'
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
      modelerTemplate: getModelerTemplate(root.businessObject),
    }
  }
  return null
}

const eventTypes = eventSubTypes

const taskTypes = new Set([
  'user-task',
  'service-task',
  'form-task',
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

const flowTypes = new Set(['sequence-flow', 'message-flow'])

const artifactTypes = new Set(['text-annotation', 'group', 'association'])

const dataTypes = new Set(['data-object-reference', 'data-store-reference'])

export interface CamundaPropertiesPanelProps {
  /** bpmn-js 模型器实例：用于监听选中元素并读写模型属性 */
  bpmnModeler?: Record<string, any>
  /** 属性表单尺寸：small / medium / large */
  formSize?: 'small' | 'medium' | 'large'
  /** 标签位置：left（左侧）/ top（顶部） */
  labelPlacement?: 'left' | 'top'
  /**
   * 额外 tab 内容映射。key 可以是元素类型或 modelerTemplate ID。
   * 查找优先级：modelerTemplate > 元素类型 > 分类 key（如 'task'/'gateway'）
   */
  extraTabs?: Record<string, any>
  /**
   * 额外 tab 的标签文本映射。key 可以是元素类型或 modelerTemplate ID。
   * 查找优先级同 extraTabs
   */
  extraTabLabels?: Record<string, string>
  /**
   * modelerTemplate → 元素类型 映射。
   * 用于注册自定义 template 的元素类型，注册后 getElementType 会优先匹配 template。
   * @example `{ 'my-connector:http-task': 'service-task' }`
   */
  templateTypes?: Record<string, string>
  /**
   * modelerTemplate → 自定义面板组件 映射。
   * 当元素匹配到 template 时，会优先使用该面板组件替代默认的类型面板。
   * 面板组件接收 common props（businessObject, element, bpmnModeler, formSize, labelPlacement, modelerTemplate）。
   */
  templatePanels?: Record<string, any>
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
    /**
     * 额外 tab 内容映射。key 可以是元素类型或 modelerTemplate ID。
     * 查找优先级：modelerTemplate > 元素类型 > 分类 key
     */
    extraTabs: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({}),
    },
    /**
     * 额外 tab 的标签文本映射。key 可以是元素类型或 modelerTemplate ID。
     * 查找优先级同 extraTabs
     */
    extraTabLabels: {
      type: Object as PropType<Record<string, string>>,
      default: () => ({}),
    },
    /**
     * modelerTemplate → 元素类型 映射。
     * 注册后 getElementType 优先匹配 template，而非 $type。
     */
    templateTypes: {
      type: Object as PropType<Record<string, string>>,
      default: () => ({}),
    },
    /**
     * modelerTemplate → 自定义面板组件 映射。
     * 模板匹配时优先使用，否则回退到类型面板。
     */
    templatePanels: {
      type: Object as PropType<Record<string, any>>,
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
    const modelerTemplate = ref<string | null>(null)
    const updateKey = ref(0)
    let modeler: any = null
    let eventBus: any = null
    let initialized = false

    /** Sync templateTypes prop to the global registry so getElementType can use them */
    watch(
      () => props.templateTypes,
      (types) => {
        if (types && Object.keys(types).length > 0) {
          registerTemplateTypes(types)
        }
      },
      { immediate: true },
    )

    /** Update all selection-related state from an element */
    function updateSelected(element: any) {
      const bo = element.businessObject
      selectedElement.value = element
      selectedBusinessObject.value = bo
      elementType.value = getElementType(element)
      modelerTemplate.value = getModelerTemplate(bo)
    }

    function handleSelectionChange(event: any) {
      const selection = event.newSelection || []
      const element = selection[0]
      if (element) {
        updateSelected(element)
      } else if (modeler) {
        const rootData = showRootProcess(modeler)
        if (rootData) {
          selectedElement.value = rootData.element
          selectedBusinessObject.value = rootData.businessObject
          elementType.value = rootData.elementType
          modelerTemplate.value = rootData.modelerTemplate
        }
      }
    }

    function handleRootAdded(event: any) {
      const element = event.element
      if (element) {
        updateSelected(element)
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
        updateSelected(currentSelection[0])
      } else {
        const rootData = showRootProcess(m)
        if (rootData) {
          selectedElement.value = rootData.element
          selectedBusinessObject.value = rootData.businessObject
          elementType.value = rootData.elementType
          modelerTemplate.value = rootData.modelerTemplate
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

    /**
     * Resolve extra tab content with template-first lookup.
     * Priority: modelerTemplate > elementType > categoryKey (e.g. 'task'/'gateway')
     */
    function resolveExtraTabContent(categoryKey?: string): any {
      const template = modelerTemplate.value
      const type = elementType.value

      if (template && props.extraTabs?.[template] !== undefined) {
        return props.extraTabs[template]
      }
      if (props.extraTabs?.[type] !== undefined) {
        return props.extraTabs[type]
      }
      if (categoryKey && props.extraTabs?.[categoryKey] !== undefined) {
        return props.extraTabs[categoryKey]
      }
      return null
    }

    /** Resolve extra tab label with the same template-first priority */
    function resolveExtraTabLabel(categoryKey?: string): string {
      const template = modelerTemplate.value
      const type = elementType.value

      if (template && props.extraTabLabels?.[template] !== undefined) {
        return props.extraTabLabels[template]!
      }
      if (props.extraTabLabels?.[type] !== undefined) {
        return props.extraTabLabels[type]!
      }
      if (categoryKey && props.extraTabLabels?.[categoryKey] !== undefined) {
        return props.extraTabLabels[categoryKey]!
      }
      return ''
    }

    return () => {
      const type = elementType.value
      const template = modelerTemplate.value
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

      /** Common props passed to all panel components */
      const common = {
        businessObject: selectedBusinessObject.value,
        element: selectedElement.value,
        bpmnModeler: props.bpmnModeler,
        formSize: props.formSize,
        labelPlacement: props.labelPlacement,
        modelerTemplate: template,
      }

      const renderPanel = (() => {
        // ── Template panel override (highest priority) ──
        if (template && props.templatePanels?.[template]) {
          return () => props.templatePanels![template]!(common)
        }

        // ── Type-based panels (template type already resolved by getElementType) ──
        if (type === 'collaboration') {
          const extraContent = resolveExtraTabContent()
          const extraLabel = resolveExtraTabLabel()
          return () => (
            <CollaborationPropertiesPanel
              {...common}
              extraTabContent={extraContent}
              extraTabLabel={extraLabel}
            />
          )
        }
        if (type === 'process') {
          const extraContent = resolveExtraTabContent()
          const extraLabel = resolveExtraTabLabel()
          return () => (
            <ProcessPropertiesPanel
              {...common}
              extraTabContent={extraContent}
              extraTabLabel={extraLabel}
            />
          )
        }
        if (eventTypes.has(type)) {
          const eventExtraContent = resolveExtraTabContent()
          const eventExtraLabel = resolveExtraTabLabel()
          return () => (
            <EventPropertiesPanel
              {...common}
              extraTabContent={eventExtraContent}
              extraTabLabel={eventExtraLabel}
            />
          )
        }
        if (subProcessTypes.has(type)) {
          const extraContent = resolveExtraTabContent()
          const extraLabel = resolveExtraTabLabel()
          return () => (
            <SubProcessPropertiesPanel
              {...common}
              extraTabContent={extraContent}
              extraTabLabel={extraLabel}
              userResolver={props.userResolver}
              groupResolver={props.groupResolver}
            />
          )
        }
        if (callActivityTypes.has(type)) {
          const extraContent = resolveExtraTabContent()
          const extraLabel = resolveExtraTabLabel()
          return () => (
            <CallActivityPropertiesPanel
              {...common}
              extraTabContent={extraContent}
              extraTabLabel={extraLabel}
              userResolver={props.userResolver}
              groupResolver={props.groupResolver}
            />
          )
        }
        if (taskTypes.has(type)) {
          const taskExtraContent = resolveExtraTabContent('task')
          const taskExtraLabel = resolveExtraTabLabel('task')
          return () => (
            <TaskPropertiesPanel
              {...common}
              extraTabContent={taskExtraContent}
              extraTabLabel={taskExtraLabel}
              userResolver={props.userResolver}
              groupResolver={props.groupResolver}
            />
          )
        }
        if (flowTypes.has(type)) {
          const extraContent = resolveExtraTabContent()
          const extraLabel = resolveExtraTabLabel()
          return type === 'message-flow'
            ? () => (
                <MessageFlowPropertiesPanel
                  {...common}
                  extraTabContent={extraContent}
                  extraTabLabel={extraLabel}
                />
              )
            : () => (
                <FlowPropertiesPanel
                  {...common}
                  extraTabContent={extraContent}
                  extraTabLabel={extraLabel}
                />
              )
        }
        if (dataTypes.has(type)) {
          const extraContent = resolveExtraTabContent()
          const extraLabel = resolveExtraTabLabel()
          return type === 'data-object-reference'
            ? () => (
                <DataObjectReferencePropertiesPanel
                  {...common}
                  extraTabContent={extraContent}
                  extraTabLabel={extraLabel}
                />
              )
            : () => (
                <DataStoreReferencePropertiesPanel
                  {...common}
                  extraTabContent={extraContent}
                  extraTabLabel={extraLabel}
                />
              )
        }
        if (artifactTypes.has(type)) {
          const extraContent = resolveExtraTabContent()
          const extraLabel = resolveExtraTabLabel()
          if (type === 'group')
            return () => (
              <GroupPropertiesPanel
                {...common}
                extraTabContent={extraContent}
                extraTabLabel={extraLabel}
              />
            )
          if (type === 'text-annotation') {
            return () => (
              <TextAnnotationPropertiesPanel
                {...common}
                extraTabContent={extraContent}
                extraTabLabel={extraLabel}
              />
            )
          }
          return () => (
            <AssociationPropertiesPanel
              {...common}
              extraTabContent={extraContent}
              extraTabLabel={extraLabel}
            />
          )
        }
        if (swimlaneTypes.has(type)) {
          const extraContent = resolveExtraTabContent()
          const extraLabel = resolveExtraTabLabel()
          return type === 'lane'
            ? () => (
                <LanePropertiesPanel
                  {...common}
                  extraTabContent={extraContent}
                  extraTabLabel={extraLabel}
                />
              )
            : () => (
                <PoolPropertiesPanel
                  {...common}
                  extraTabContent={extraContent}
                  extraTabLabel={extraLabel}
                />
              )
        }
        if (gatewayTypes.has(type)) {
          const gwExtraContent = resolveExtraTabContent('gateway')
          const gwExtraLabel = resolveExtraTabLabel('gateway')
          return () => (
            <GatewayPropertiesPanel
              {...common}
              extraTabContent={gwExtraContent}
              extraTabLabel={gwExtraLabel}
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
