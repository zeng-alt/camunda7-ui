import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInput, NSelect } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { uid, getDefinitions } from './eventHelpers'

export default defineComponent({
  name: 'SignalDefinitionFields',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const selectedSignalId = ref<string | null>(null)
    const selectedSignalName = ref('')
    const signalOptions = ref<{ label: string; value: string }[]>([])

    function getModeler() {
      return props.bpmnModeler
    }

    function getEventDef() {
      return props.businessObject?.eventDefinitions?.[0]
    }

    function buildSignalOptions() {
      const definitions = getDefinitions(toRaw(props.businessObject))
      const elements = definitions?.rootElements?.filter((e: any) => e.$type === 'bpmn:Signal') || []
      const opts: { label: string; value: string }[] = [
        { label: t('bpmnPanel.eventDef.none'), value: '__none__' },
        { label: t('bpmnPanel.eventDef.createNew'), value: '__create__' },
      ]
      for (const el of elements) {
        opts.push({ label: el.name || el.id || 'Unnamed', value: el.id })
      }
      signalOptions.value = opts
    }

    function syncFromModel() {
      const def = getEventDef()
      if (!def) return
      selectedSignalId.value = def.signalRef?.id || null
      selectedSignalName.value = def.signalRef?.name || ''
      buildSignalOptions()
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true, deep: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function onSignalSelect(value: string) {
      const ed = getEventDef()
      if (!getModeler() || !props.element || !ed) return
      const modeling = getModeler().get('modeling')
      const moddle = getModeler().get('moddle')

      if (value === '__none__') {
        selectedSignalId.value = null
        selectedSignalName.value = ''
        modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), { signalRef: undefined })
        return
      }

      if (value === '__create__') {
        const id = uid()
        const name = 'newSignal'
        const newSignal = moddle.create('bpmn:Signal', { id, name })
        const definitions = getDefinitions(toRaw(props.businessObject))
        if (definitions && definitions.rootElements) {
          definitions.rootElements.push(newSignal)
        }
        selectedSignalId.value = id
        selectedSignalName.value = name
        modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), { signalRef: newSignal })
        buildSignalOptions()
        return
      }

      const definitions = getDefinitions(toRaw(props.businessObject))
      const sig = definitions?.rootElements?.find((e: any) => e.id === value)
      if (sig) {
        selectedSignalId.value = value
        selectedSignalName.value = sig.name || ''
        modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), { signalRef: sig })
      }
    }

    function onSignalNameChange(val: string | null) {
      selectedSignalName.value = val ?? ''
      const ed = getEventDef()
      const ref = ed?.signalRef
      if (ref && getModeler() && props.element) {
        const modeling = getModeler().get('modeling')
        modeling.updateModdleProperties(toRaw(props.element), ref, { name: val ?? '' })
        buildSignalOptions()
      }
    }

    return () => (
      <div>
        <NSelect
          value={selectedSignalId.value}
          onUpdateValue={onSignalSelect}
          options={signalOptions.value}
          size={props.formSize}
          placeholder={t('bpmnPanel.placeholders.signalRef')}
        />
        {selectedSignalId.value && (
          <div class="mt-8px">
            <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.signalName')}</div>
            <NInput
              value={selectedSignalName.value}
              onUpdateValue={onSignalNameChange}
              placeholder={t('bpmnPanel.fields.signalName')}
              size={props.formSize}
            />
          </div>
        )}
      </div>
    )
  },
})
