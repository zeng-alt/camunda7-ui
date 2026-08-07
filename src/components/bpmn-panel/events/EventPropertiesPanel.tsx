import { defineComponent, computed, ref, watch, type PropType } from 'vue'
import { NTabPane } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { getEventSubType } from '@/utils/bpmn'
import {
  GeneralPanel,
  DocumentationPanel,
  ExtensionPropertiesPanel,
  ExecutionListenersPanel,
  AsyncCheckboxes,
  ConfigurableTabs,
} from '../base'
import StartEventExtraFields, { startEventTabs } from './StartEventExtraFields'
import IntermediateCatchEventExtraFields, {
  intermediateCatchEventTabs,
} from './IntermediateCatchEventExtraFields'
import IntermediateThrowEventExtraFields, {
  intermediateThrowEventTabs,
} from './IntermediateThrowEventExtraFields'
import BoundaryEventExtraFields, { boundaryEventTabs } from './BoundaryEventExtraFields'
import EndEventExtraFields, { endEventTabs } from './EndEventExtraFields'
import { getEventDefType } from './EventDefinitionPanel'
import { LintPanel, LintTabLabel } from '../lint'

const extraFieldsMap: Record<
  string,
  { component: any; tabs: { name: string; labelKey: string }[] }
> = {
  'start-event': { component: StartEventExtraFields, tabs: startEventTabs },
  'intermediate-catch-event': {
    component: IntermediateCatchEventExtraFields,
    tabs: intermediateCatchEventTabs,
  },
  'intermediate-throw-event': {
    component: IntermediateThrowEventExtraFields,
    tabs: intermediateThrowEventTabs,
  },
  'boundary-event': { component: BoundaryEventExtraFields, tabs: boundaryEventTabs },
  'end-event': { component: EndEventExtraFields, tabs: endEventTabs },
}

export default defineComponent({
  name: 'EventPropertiesPanel',
  props: {
    // 当前元素的 BPMN 业务对象（BusinessObject），用于读写模型属性
    businessObject: { type: Object as PropType<any>, default: null },
    // 当前选中的 BPMN 图形元素
    element: { type: Object as PropType<any>, default: null },
    // bpmn-js 模型器实例，用于执行建模命令、读写模型
    bpmnModeler: { type: Object, default: null },
    // 表单控件尺寸：small / medium / large
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    // 标签位置：left（左侧）/ top（顶部）
    labelPlacement: { type: String as PropType<'left' | 'top'>, default: 'left' },
    // 元素的 modelerTemplate ID，由 CamundaPropertiesPanel 传入
    modelerTemplate: { type: String as PropType<string | null>, default: null },
    // 自定义 Tab 内容渲染函数
    extraTabContent: {
      type: Function,
      default: null,
    },
    // 自定义 Tab 标签文本
    extraTabLabel: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const eventType = computed(() => getEventSubType(props.businessObject))
    const tabValue = ref('general')

    watch(
      () => props.businessObject,
      () => {
        tabValue.value = 'general'
      },
    )

    const defType = computed(() => getEventDefType(props.businessObject))

    return () => {
      const type = eventType.value
      const def = defType.value

      if (!type) {
        return (
          <div class="flex items-center justify-center h-full text-#888 text-13px">
            <p>{t('bpmnPanel.panel.noProcess')}</p>
          </div>
        )
      }

      const config = extraFieldsMap[type]!
      const tabs = config.tabs
      const extendedTabs = props.extraTabContent
        ? [...tabs, { name: 'custom', labelKey: '' }]
        : tabs

      return (
        <div class="p-8px">
          <ConfigurableTabs
            value={tabValue.value}
            onUpdateValue={(v: string) => {
              tabValue.value = v
            }}
            size="small"
            type="line"
          >
            <NTabPane name="general" tab={t('bpmnPanel.tabs.general')}>
              <div class="pt-8px">
                <GeneralPanel
                  businessObject={props.businessObject}
                  element={props.element}
                  bpmnModeler={props.bpmnModeler}
                  formSize={props.formSize}
                  labelPlacement={props.labelPlacement}
                />
                <DocumentationPanel
                  businessObject={props.businessObject}
                  element={props.element}
                  bpmnModeler={props.bpmnModeler}
                  formSize={props.formSize}
                />
                <AsyncCheckboxes
                  businessObject={props.businessObject}
                  element={props.element}
                  bpmnModeler={props.bpmnModeler}
                  formSize={props.formSize}
                  showJob={'Timer' === def}
                />
              </div>
            </NTabPane>
            {extendedTabs.map((tab) => (
              <NTabPane
                name={tab.name}
                tab={
                  tab.name === 'custom'
                    ? props.extraTabLabel || t('bpmnPanel.tabs.custom')
                    : t(tab.labelKey)
                }
              >
                <config.component
                  businessObject={props.businessObject}
                  element={props.element}
                  bpmnModeler={props.bpmnModeler}
                  formSize={props.formSize}
                  tabName={tab.name}
                  extraTabContent={props.extraTabContent}
                  extraTabLabel={props.extraTabLabel}
                  elementType={def}
                  modelerTemplate={props.modelerTemplate}
                />
              </NTabPane>
            ))}
            <NTabPane name="executionListeners" tab={t('bpmnPanel.tabs.executionListeners')}>
              <div class="pt-8px">
                <ExecutionListenersPanel
                  businessObject={props.businessObject}
                  element={props.element}
                  bpmnModeler={props.bpmnModeler}
                  formSize={props.formSize}
                />
              </div>
            </NTabPane>
            <NTabPane name="extensionProperties" tab={t('bpmnPanel.tabs.extensionProperties')}>
              <div class="pt-8px">
                <ExtensionPropertiesPanel
                  businessObject={props.businessObject}
                  element={props.element}
                  bpmnModeler={props.bpmnModeler}
                  formSize={props.formSize}
                />
              </div>
            </NTabPane>
            <NTabPane
              name="lint"
              tab={() => (
                <LintTabLabel businessObject={props.businessObject} bpmnModeler={props.bpmnModeler} />
              )}
            >
              <div class="pt-8px">
                <LintPanel
                  businessObject={props.businessObject}
                  element={props.element}
                  bpmnModeler={props.bpmnModeler}
                  formSize={props.formSize}
                />
              </div>
            </NTabPane>
          </ConfigurableTabs>
        </div>
      )
    }
  },
})
