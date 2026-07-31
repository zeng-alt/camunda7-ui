import { defineComponent, type PropType } from 'vue'
import { useCamundaI18n } from '../../../locales'
import { InputsPanel, OutputsPanel, type ExtraFieldTab } from '../base'
import EventDefinitionPanel from './EventDefinitionPanel'

export const boundaryEventTabs: ExtraFieldTab[] = [
  { name: 'boundary', labelKey: 'bpmnPanel.tabs.boundary' },
  { name: 'inputs', labelKey: 'bpmnPanel.tabs.input' },
  { name: 'outputs', labelKey: 'bpmnPanel.tabs.output' },
]

import { useFormSize } from '../../../composables'

export default defineComponent({
  name: 'BoundaryEventExtraFields',
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
    tabName: { type: String, default: 'boundary' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const { labelClass } = useFormSize(() => props.formSize)

    return () => {
      if (props.tabName === 'boundary') {
        return (
          <div class="pt-8px">
            <div class={`mb-8px ${labelClass}`}>{t('bpmnPanel.fields.eventDefinition')}</div>
            <EventDefinitionPanel
              businessObject={props.businessObject}
              element={props.element}
              bpmnModeler={props.bpmnModeler}
              formSize={props.formSize}
              showVariableEvents
            />
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

      if (props.tabName === 'outputs') {
        return (
          <div class="pt-8px">
            <OutputsPanel
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
