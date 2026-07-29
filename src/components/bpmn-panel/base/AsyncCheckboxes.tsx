import { defineComponent, ref, watch, toRaw, computed, type PropType } from 'vue'
import { NCheckbox, NInput, NTooltip, NFormItem, NInputNumber } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'

export default defineComponent({
  name: 'AsyncCheckboxes',
  props: {
    businessObject: {
      type: Object as PropType<any>,
      default: null,
    },
    element: {
      type: Object as PropType<any>,
      default: null,
    },
    bpmnModeler: {
      type: Object,
      default: null,
    },
    formSize: {
      type: String as PropType<'small' | 'medium' | 'large'>,
      default: 'small',
    },
  },
  setup(props) {
    const { t } = useCamundaI18n()

    const asyncBefore = ref(false)
    const asyncAfter = ref(false)
    const exclusive = ref(false)
    const retryTimeCycle = ref('')
    const jobPriority = ref<number | null>()

    const showJobExecution = computed(() => asyncBefore.value || asyncAfter.value)

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) return
      asyncBefore.value = bo.asyncBefore === true
      asyncAfter.value = bo.asyncAfter === true
      exclusive.value = bo.exclusive !== false
      retryTimeCycle.value =
        bo['camunda:failedJobRetryTimeCycle'] ?? bo.failedJobRetryTimeCycle ?? ''
      jobPriority.value = bo.jobPriority ?? null
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function updateProperty(key: string, value: any) {
      if (!props.bpmnModeler || !props.element) return
      const modeling = props.bpmnModeler.get('modeling')
      modeling.updateProperties(toRaw(props.element), { [key]: value })
    }

    function onAsyncBeforeChange(val: boolean) {
      asyncBefore.value = val
      updateProperty('asyncBefore', val)
    }

    function onAsyncAfterChange(val: boolean) {
      asyncAfter.value = val
      updateProperty('asyncAfter', val)
    }

    function onExclusiveChange(val: boolean) {
      exclusive.value = val
      updateProperty('exclusive', val)
    }

    function onRetryTimeCycleChange(val: string | null) {
      retryTimeCycle.value = val ?? ''
      updateProperty('failedJobRetryTimeCycle', val ?? '')
    }

    function onJobPriorityChange(val: number | null) {
      jobPriority.value = val ?? null
      updateProperty('jobPriority', val ?? null)
    }

    return () => (
      <div>
        <div class="flex flex-row gap-8px">
          <NFormItem
            label={t('bpmnPanel.fields.asyncContinuousExecution')}
            size={props.formSize}
            label-placement="top"
            label-align="left"
            label-width="80"
          >
            <NCheckbox
              checked={asyncBefore.value}
              onUpdateChecked={onAsyncBeforeChange}
              size={props.formSize === 'small' ? 'small' : 'medium'}
            >
              {t('bpmnPanel.fields.asyncBefore')}
            </NCheckbox>
            <NCheckbox
              checked={asyncAfter.value}
              onUpdateChecked={onAsyncAfterChange}
              size={props.formSize === 'small' ? 'small' : 'medium'}
            >
              {t('bpmnPanel.fields.asyncAfter')}
            </NCheckbox>
            <NCheckbox
              checked={exclusive.value}
              onUpdateChecked={onExclusiveChange}
              size={props.formSize === 'small' ? 'small' : 'medium'}
            >
              {t('bpmnPanel.fields.exclusive')}
            </NCheckbox>
          </NFormItem>
        </div>
        {showJobExecution.value && (
          <div class="mt-8px flex flex-col gap-8px">
            <div class="text-12px font-bold text-#888">{t('bpmnPanel.fields.jobExecution')}</div>
            <div>
              <div class="mb-4px text-12px">
                <NTooltip trigger="hover" placement="top">
                  {{
                    trigger: () => (
                      <span class="border-b border-dashed border-#1890ff text-#1890ff cursor-help">
                        {t('bpmnPanel.fields.retryTimeCycle')}
                      </span>
                    ),
                    default: () => t('bpmnPanel.tooltips.retryTimeCycle'),
                  }}
                </NTooltip>
              </div>
              <NInput
                value={retryTimeCycle.value}
                onUpdateValue={onRetryTimeCycleChange}
                placeholder={t('bpmnPanel.placeholders.retryTimeCycle')}
                size={props.formSize}
              />
            </div>
            <div>
              <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.jobPriority')}</div>
              <NInputNumber
                value={jobPriority.value}
                onUpdateValue={onJobPriorityChange}
                placeholder={t('bpmnPanel.placeholders.jobPriority')}
                size={props.formSize}
                clearable
              />
            </div>
          </div>
        )}
      </div>
    )
  },
})
