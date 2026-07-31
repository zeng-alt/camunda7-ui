import { defineComponent, computed, type PropType } from 'vue'
import { useCamundaI18n } from '../../../locales'
import type { ExtraFieldTab } from '../base'
import { InputsPanel, InMappingPropagation, InMappings } from '../base'
import EventDefinitionPanel, { getEventDefType } from './EventDefinitionPanel'

export const endEventTabs: ExtraFieldTab[] = [
  { name: 'endEvent', labelKey: 'bpmnPanel.tabs.endEvent' },
  { name: 'inputs', labelKey: 'bpmnPanel.tabs.input' },
]

export default defineComponent({
  name: 'EndEventExtraFields',
  props: {
    // 当前元素的 BPMN 业务对象（BusinessObject），用于读写模型属性
    businessObject: { type: Object as PropType<any>, default: null },
    // 当前选中的 BPMN 图形元素
    element: { type: Object as PropType<any>, default: null },
    // bpmn-js 模型器实例，用于执行建模命令、读写模型
    bpmnModeler: { type: Object, default: null },
    // 表单控件尺寸：small / medium / large
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    // 所属 tab 名称
    tabName: { type: String, default: 'endEvent' },
    // 自定义 Tab 内容渲染函数
    extraTabContent: { type: Function, default: null },
    // 自定义 Tab 标签文本
    extraTabLabel: { type: String, default: '' },
    // 元素类型标识
    elementType: { type: String, default: '' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const isSignal = computed(() => getEventDefType(props.businessObject) === 'Signal')

    return () => {
      if (props.tabName === 'custom') {
        return (
          <div class="pt-8px">
            {props.extraTabContent({
              element: props.element,
              businessObject: props.businessObject,
              type: props.elementType,
            })}
          </div>
        )
      }
      if (props.tabName === 'endEvent') {
        return (
          <div class="pt-8px">
            <div class="mb-8px text-12px text-#666">{t('bpmnPanel.fields.eventDefinition')}</div>
            <EventDefinitionPanel
              businessObject={props.businessObject}
              element={props.element}
              bpmnModeler={props.bpmnModeler}
              formSize={props.formSize}
            />
            {isSignal.value && (
              <>
                <div class="mt-12px">
                  <InMappingPropagation
                    businessObject={props.businessObject}
                    element={props.element}
                    bpmnModeler={props.bpmnModeler}
                    formSize={props.formSize}
                  />
                </div>
                <div class="mt-8px">
                  <InMappings
                    businessObject={props.businessObject}
                    element={props.element}
                    bpmnModeler={props.bpmnModeler}
                    formSize={props.formSize}
                  />
                </div>
              </>
            )}
          </div>
        )
      }
      if (props.tabName === 'inputs') {
        return (
          <div class="pt-8px">
            <InputsPanel
              businessObject={props.businessObject}
              element={props.element}
              bpmnModeler={props.bpmnModeler}
              formSize={props.formSize}
            />
          </div>
        )
      }
      return null
    }
  },
})
