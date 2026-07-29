import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInputNumber } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import ExternalTopicPicker from './ExternalTopicPicker'

export default defineComponent({
  name: 'ExternalTaskFields',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
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

    function save() {
      if (!props.bpmnModeler || !props.element) return
      const modeling = (props.bpmnModeler as any).get('modeling')
      modeling.updateProperties(toRaw(props.element), {
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
          <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.topic')}</div>
          <ExternalTopicPicker
            value={topic.value}
            onUpdate:value={onTopicChange}
            formSize={props.formSize}
          />
        </div>
        <div class="mb-8px">
          <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.externalTaskPriority')}</div>
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
