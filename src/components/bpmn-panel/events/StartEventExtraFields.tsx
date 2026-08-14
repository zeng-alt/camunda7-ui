import { defineComponent, type PropType } from 'vue'
import { useCamundaI18n } from '../../../locales'
import { useFormSize } from '../../../composables'
import type { ExtraFieldTab } from '../base'
import FormPanel from '../base/FormPanel'
import EventDefinitionPanel from './EventDefinitionPanel'

export const startEventTabs: ExtraFieldTab[] = [
  { name: 'startEvent', labelKey: 'bpmnPanel.tabs.startEvent' },
  { name: 'forms', labelKey: 'bpmnPanel.tabs.forms' },
]

export default defineComponent({
  name: 'StartEventExtraFields',
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
    tabName: { type: String, default: 'startEvent' },
    // 自定义 Tab 内容渲染函数
    extraTabContent: { type: Function, default: null },
    // 自定义 Tab 标签文本
    extraTabLabel: { type: String, default: '' },
    // 元素类型标识
    elementType: { type: String, default: '' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const { labelClass } = useFormSize(() => props.formSize)

    return () => {
      if (props.tabName === 'forms') {
        return (
          <div class="pt-8px">
            <FormPanel
              businessObject={props.businessObject}
              element={props.element}
              bpmnModeler={props.bpmnModeler}
              formSize={props.formSize}
            />
          </div>
        )
      }

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

      return (
        <div class="pt-8px">
          <div class="mt-16px">
            <div class={`mb-8px ${labelClass.value}`}>{t('bpmnPanel.fields.eventDefinition')}</div>
            <EventDefinitionPanel
              businessObject={props.businessObject}
              element={props.element}
              bpmnModeler={props.bpmnModeler}
              formSize={props.formSize}
              showCodeVariable
            />
          </div>
        </div>
      )
    }
  },
})
