import { defineComponent, ref, watch, computed, type PropType } from 'vue'
import { NCheckbox, NInput, NTooltip, NFormItem, NInputNumber } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useBpmnProperties, useFormSize } from '../../../composables'

export default defineComponent({
  name: 'AsyncCheckboxes',
  props: {
    // 当前元素的 BPMN 业务对象（BusinessObject），用于读写模型属性
    businessObject: {
      type: Object as PropType<any>,
      default: null,
    },
    // 当前选中的 BPMN 图形元素
    element: {
      type: Object as PropType<any>,
      default: null,
    },
    // bpmn-js 模型器实例，用于执行建模命令、读写模型
    bpmnModeler: {
      type: Object,
      default: null,
    },
    // 表单控件尺寸：small / medium / large
    formSize: {
      type: String as PropType<'small' | 'medium' | 'large'>,
      default: 'small',
    },
    // 是否显示作业执行（Job）相关配置
    showJob: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const { labelClass } = useFormSize(() => props.formSize)
    const { getModdle, getOrCreateExtensionElements, updateProperty, updateProperties } =
      useBpmnProperties(props)

    const asyncBefore = ref(false)
    const asyncAfter = ref(false)
    const exclusive = ref(false)
    const retryTimeCycle = ref('')
    const jobPriority = ref<number | null>()

    const showJobExecution = computed(() => props.showJob || asyncBefore.value || asyncAfter.value)

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) return
      asyncBefore.value = bo.asyncBefore === true
      asyncAfter.value = bo.asyncAfter === true
      exclusive.value = bo.exclusive !== false
      const extValues = bo.extensionElements?.values || []
      const retryCycle = extValues.find((v: any) => v.$type === 'camunda:FailedJobRetryTimeCycle')
      retryTimeCycle.value = retryCycle?.body ?? ''
      jobPriority.value = bo.jobPriority ?? null
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

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
      const moddle = getModdle()
      const ee = getOrCreateExtensionElements()
      if (!moddle || !ee) return
      let retry = ee.values.find((v: any) => v.$type === 'camunda:FailedJobRetryTimeCycle')
      if (val) {
        if (!retry) {
          retry = moddle.create('camunda:FailedJobRetryTimeCycle', { body: val })
          ee.get('values').push(retry)
        } else {
          retry.body = val
        }
      } else if (retry) {
        ee.values = ee.values.filter((v: any) => v !== retry)
      }
      updateProperties({ extensionElements: ee })
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
              <div class={`mb-4px ${labelClass}`}>{t('bpmnPanel.fields.jobPriority')}</div>
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
