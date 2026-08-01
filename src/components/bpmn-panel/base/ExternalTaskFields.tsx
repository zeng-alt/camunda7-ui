import { defineComponent, ref, watch, type PropType } from 'vue'
import { NInputNumber } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useBpmnProperties, useFormSize } from '@/composables'
import ExternalTopicPicker from './ExternalTopicPicker'

export default defineComponent({
  name: 'ExternalTaskFields',
  props: {
    // 当前元素的 BPMN 业务对象（BusinessObject），用于读写模型属性
    businessObject: { type: Object as PropType<any>, default: null },
    // 当前选中的 BPMN 图形元素
    element: { type: Object as PropType<any>, default: null },
    // bpmn-js 模型器实例，用于执行建模命令、读写模型
    bpmnModeler: { type: Object, default: null },
    // 表单控件尺寸：small / medium / large
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const { labelClass } = useFormSize(() => props.formSize)
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

    const { updateProperties } = useBpmnProperties(props)

    function save() {
      updateProperties({
        topic: topic.value || undefined,
        taskPriority: priority.value ?? undefined,
      })
    }

    function onTopicChange(val: string | null) {
      topic.value = val ?? ''
      save()
    }

    function onPriorityChange(val: number | null) {
      priority.value = val
      save()
    }

    return () => (
      <>
        <div class="mb-8px">
          <div class={`mb-4px ${labelClass.value}`}>{t('bpmnPanel.fields.topic')}</div>
          <ExternalTopicPicker
            value={topic.value}
            onUpdate:value={onTopicChange}
            formSize={props.formSize}
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
      </>
    )
  },
})
