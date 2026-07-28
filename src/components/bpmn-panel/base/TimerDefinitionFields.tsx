import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInput, NRadioGroup, NRadio, NSpace } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { HintTooltip } from '.'

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

    function getModeler() {
      return props.bpmnModeler
    }

    function getEventDef() {
      return props.businessObject?.eventDefinitions?.[0]
    }

    function syncFromModel() {
      const def = getEventDef()
      if (!def) return
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
      </div>
    )
  },
})
