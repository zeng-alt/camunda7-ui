import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInput, NSelect } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { HintTooltip } from '../base'
import { uid, getDefinitions } from './eventHelpers'

export default defineComponent({
  name: 'EscalationDefinitionFields',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    showCodeVariable: { type: Boolean, default: false },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const selectedEscId = ref<string | null>(null)
    const selectedEscName = ref('')
    const selectedEscCode = ref('')
    const codeVariable = ref('')
    const escalationOptions = ref<{ label: string; value: string }[]>([])

    function getModeler() {
      return props.bpmnModeler
    }

    function getEventDef() {
      return props.businessObject?.eventDefinitions?.[0]
    }

    function buildEscalationOptions() {
      const definitions = getDefinitions(toRaw(props.businessObject))
      const elements =
        definitions?.rootElements?.filter((e: any) => e.$type === 'bpmn:Escalation') || []
      const opts: { label: string; value: string }[] = [
        { label: t('bpmnPanel.eventDef.none'), value: '__none__' },
        { label: t('bpmnPanel.eventDef.createNew'), value: '__create__' },
      ]
      for (const el of elements) {
        opts.push({ label: el.name || el.id || 'Unnamed', value: el.id })
      }
      escalationOptions.value = opts
    }

    function syncFromModel() {
      const def = getEventDef()
      if (!def) return
      const ref = def.escalationRef
      selectedEscId.value = ref?.id || null
      selectedEscName.value = ref?.name || ''
      selectedEscCode.value = ref?.escalationCode || ''
      codeVariable.value = def.get('camunda:escalationCodeVariable') || ''
      buildEscalationOptions()
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true, deep: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function onEscalationSelect(value: string) {
      const ed = getEventDef()
      if (!getModeler() || !props.element || !ed) return
      const modeling = getModeler().get('modeling')
      const moddle = getModeler().get('moddle')

      if (value === '__none__') {
        selectedEscId.value = null
        selectedEscName.value = ''
        selectedEscCode.value = ''
        modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), {
          escalationRef: undefined,
        })
        return
      }

      if (value === '__create__') {
        const id = uid()
        const newEsc = moddle.create('bpmn:Escalation', { id, name: id })
        const definitions = getDefinitions(toRaw(props.businessObject))
        if (definitions && definitions.rootElements) {
          definitions.rootElements.push(newEsc)
        }
        selectedEscId.value = id
        selectedEscName.value = id
        selectedEscCode.value = ''
        modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), { escalationRef: newEsc })
        buildEscalationOptions()
        return
      }

      const definitions = getDefinitions(toRaw(props.businessObject))
      const esc = definitions?.rootElements?.find((e: any) => e.id === value)
      if (esc) {
        selectedEscId.value = value
        selectedEscName.value = esc.name || ''
        selectedEscCode.value = esc.escalationCode || ''
        modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), { escalationRef: esc })
      }
    }

    function onEscalationNameChange(val: string | null) {
      selectedEscName.value = val ?? ''
      const ed = getEventDef()
      const ref = ed?.escalationRef
      if (ref && getModeler() && props.element) {
        const modeling = getModeler().get('modeling')
        modeling.updateModdleProperties(toRaw(props.element), ref, { name: val ?? '' })
        buildEscalationOptions()
      }
    }

    function onEscalationCodeChange(val: string | null) {
      selectedEscCode.value = val ?? ''
      const ed = getEventDef()
      const ref = ed?.escalationRef
      if (ref && getModeler() && props.element) {
        const modeling = getModeler().get('modeling')
        modeling.updateModdleProperties(toRaw(props.element), ref, { escalationCode: val ?? '' })
      }
    }

    function onCodeVariableChange(val: string | null) {
      codeVariable.value = val ?? ''
      const ed = getEventDef()
      if (ed && getModeler() && props.element) {
        const modeling = getModeler().get('modeling')
        modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), {
          'camunda:escalationCodeVariable': val ?? '',
        })
      }
    }

    return () => (
      <div>
        <NSelect
          value={selectedEscId.value}
          onUpdateValue={onEscalationSelect}
          options={escalationOptions.value}
          size={props.formSize}
          placeholder={t('bpmnPanel.placeholders.escalationRef')}
        />
        {selectedEscId.value && (
          <div class="mt-8px">
            <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.escalationName')}</div>
            <NInput
              value={selectedEscName.value}
              onUpdateValue={onEscalationNameChange}
              placeholder={t('bpmnPanel.fields.escalationName')}
              size={props.formSize}
            />
            <div class="mt-8px mb-4px text-12px text-#666">
              {t('bpmnPanel.fields.escalationCode')}
            </div>
            <NInput
              value={selectedEscCode.value}
              onUpdateValue={onEscalationCodeChange}
              placeholder={t('bpmnPanel.fields.escalationCode')}
              size={props.formSize}
            />
            {props.showCodeVariable && (
              <div class="mt-8px">
                <HintTooltip
                  label={t('bpmnPanel.fields.escalationCodeVariable')}
                  hint={t('bpmnPanel.fields.hintEscalationCodeVariable')}
                />
                <NInput
                  value={codeVariable.value}
                  onUpdateValue={onCodeVariableChange}
                  size={props.formSize}
                  class="mt-4px"
                />
              </div>
            )}
          </div>
        )}
      </div>
    )
  },
})
