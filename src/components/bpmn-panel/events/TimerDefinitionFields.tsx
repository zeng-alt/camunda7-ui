import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInput, NInputNumber, NRadioGroup, NRadio, NSpace, NTooltip } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { HintTooltip } from '../base'

export default defineComponent({
  name: 'TimerDefinitionFields',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const timerActiveField = ref('timeDuration')
    const timerValue = ref('')
    const retryTimeCycle = ref('')
    const jobPriority = ref<number | null>()

    function getModeler() {
      return props.bpmnModeler
    }

    function getEventDef() {
      return props.businessObject?.eventDefinitions?.[0]
    }

    function syncFromModel() {
      const bo = props.businessObject
      const def = getEventDef()
      if (def) {
        if (def.timeDate?.body) {
          timerActiveField.value = 'timeDate'
          timerValue.value = def.timeDate.body
        } else if (def.timeDuration?.body) {
          timerActiveField.value = 'timeDuration'
          timerValue.value = def.timeDuration.body
        } else if (def.timeCycle?.body) {
          timerActiveField.value = 'timeCycle'
          timerValue.value = def.timeCycle.body
        } else {
          timerActiveField.value = 'none'
          timerValue.value = ''
        }
      }
      if (bo) {
        const extValues = bo.extensionElements?.values || []
        const retryCycle = extValues.find((v: any) => v.$type === 'camunda:FailedJobRetryTimeCycle')
        retryTimeCycle.value = retryCycle?.body ?? ''
        jobPriority.value = bo.jobPriority ?? ''
      }
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true, deep: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function onTimerTypeChange(field: string) {
      const ed = getEventDef()
      if (!getModeler() || !props.element || !ed) return
      const modeling = getModeler().get('modeling')

      if (field === 'none') {
        timerActiveField.value = 'none'
        timerValue.value = ''
        modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), {
          timeDate: undefined,
          timeDuration: undefined,
          timeCycle: undefined,
        })
        return
      }

      const moddle = getModeler().get('moddle')
      const oldFields = ['timeDate', 'timeDuration', 'timeCycle']
      const cleanup: Record<string, any> = {}
      for (const f of oldFields) {
        if (f !== field) cleanup[f] = undefined
      }
      if (timerValue.value) {
        cleanup[field] = moddle.create('bpmn:FormalExpression', { body: timerValue.value })
      }
      modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), cleanup)
      timerActiveField.value = field
    }

    function onTimerValueChange(val: string | null) {
      timerValue.value = val ?? ''
      if (timerActiveField.value === 'none') return
      const ed = getEventDef()
      if (!getModeler() || !props.element || !ed) return
      const modeling = getModeler().get('modeling')
      const moddle = getModeler().get('moddle')

      const existing = ed[timerActiveField.value]
      if (existing) {
        modeling.updateModdleProperties(toRaw(props.element), toRaw(existing), { body: val ?? '' })
      } else if (val) {
        const expr = moddle.create('bpmn:FormalExpression', { body: val })
        modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), {
          [timerActiveField.value]: expr,
        })
      }
    }

    function onRetryTimeCycleChange(val: string | null) {
      retryTimeCycle.value = val ?? ''
      if (!props.bpmnModeler || !props.element) return
      const moddle = props.bpmnModeler.get('moddle')
      const bo = props.businessObject
      if (!bo) return
      if (!bo.extensionElements) {
        bo.extensionElements = moddle.create('bpmn:ExtensionElements', { values: [] })
      }
      const ee = bo.extensionElements
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
      const modeling = props.bpmnModeler.get('modeling')
      modeling.updateProperties(toRaw(props.element), { extensionElements: bo.extensionElements })
    }

    function onJobPriorityChange(val: number | null) {
      jobPriority.value = val ?? null
      if (!props.bpmnModeler || !props.element) return
      const modeling = props.bpmnModeler.get('modeling')
      modeling.updateProperties(toRaw(props.element), { jobPriority: val ?? null })
    }

    return () => (
      <div>
        <div class="mb-8px">
          <NRadioGroup value={timerActiveField.value} onUpdateValue={onTimerTypeChange}>
            <NSpace>
              <NRadio value="none">{t('bpmnPanel.eventDef.none')}</NRadio>
              <div class="flex items-center gap-2px">
                <NRadio value="timeDate" />
                <HintTooltip
                  label={t('bpmnPanel.fields.timerDate')}
                  hint={t('bpmnPanel.tooltips.timerDate')}
                />
              </div>
              <div class="flex items-center gap-2px">
                <NRadio value="timeDuration" />
                <HintTooltip
                  label={t('bpmnPanel.fields.timerDuration')}
                  hint={t('bpmnPanel.tooltips.timerDuration')}
                />
              </div>
              <div class="flex items-center gap-2px">
                <NRadio value="timeCycle" />
                <HintTooltip
                  label={t('bpmnPanel.fields.timerCycle')}
                  hint={t('bpmnPanel.tooltips.timerCycle')}
                />
              </div>
            </NSpace>
          </NRadioGroup>
        </div>
        {timerActiveField.value !== 'none' && (
          <NInput
            value={timerValue.value}
            onUpdateValue={onTimerValueChange}
            placeholder={t('bpmnPanel.placeholders.' + timerActiveField.value)}
            size={props.formSize}
          />
        )}
        <div class="mt-12px">
          <div class="text-12px font-bold text-#888">{t('bpmnPanel.fields.jobExecution')}</div>
          <div class="mt-8px">
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
          <div class="mt-8px">
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
      </div>
    )
  },
})
