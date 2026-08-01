import { defineComponent, ref, watch, type PropType } from 'vue'
import { NInput, NInputNumber } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useBpmnProperties, useFormSize } from '../../../composables'
import type { ExtraFieldTab } from '../base'
import ErrorFields from '../base/ErrorFields'

export const externalTaskTabs: ExtraFieldTab[] = [
  { name: 'external', labelKey: 'bpmnPanel.tabs.external' },
]

export default defineComponent({
  name: 'ExternalTaskExtraFields',
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
    tabName: { type: String, default: 'external' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const { labelClass } = useFormSize(() => props.formSize)
    const { updateProperties, updateProperty } = useBpmnProperties(props)

    const topic = ref('')
    const priority = ref<number | null>(null)

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) return
      topic.value = bo.topic || ''
      priority.value = bo.taskPriority ?? null
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function onTopicChange(val: string | null) {
      topic.value = val ?? ''
      if (val) {
        updateProperties({ topic: val, type: 'external' })
      } else {
        updateProperties({ topic: undefined, type: undefined })
      }
    }

    function onPriorityChange(val: number | null) {
      priority.value = val
      updateProperty('taskPriority', val)
    }

    return () => {
      if (props.tabName !== 'external') return null

      return (
        <div class="pt-8px">
          <div class="mb-8px">
            <div class={`mb-4px ${labelClass.value}`}>{t('bpmnPanel.fields.topic')}</div>
            <NInput
              value={topic.value}
              onUpdateValue={onTopicChange}
              placeholder={t('bpmnPanel.placeholders.topic')}
              size={props.formSize}
            />
          </div>

          <div class="mb-8px">
            <div class={`mb-4px ${labelClass.value}`}>
              {t('bpmnPanel.fields.externalTaskPriority')}
            </div>
            <NInputNumber
              value={priority.value}
              onUpdateValue={onPriorityChange}
              placeholder={t('bpmnPanel.placeholders.taskPriority')}
              size={props.formSize}
              min={0}
              class="w-full"
            />
          </div>

          <div class="mt-16px">
            <div class="text-12px font-bold mb-8px">{t('bpmnPanel.fields.errors')}</div>
            <ErrorFields
              businessObject={props.businessObject}
              element={props.element}
              bpmnModeler={props.bpmnModeler}
              formSize={props.formSize}
            />
          </div>
        </div>
      )
    }
  },
})
