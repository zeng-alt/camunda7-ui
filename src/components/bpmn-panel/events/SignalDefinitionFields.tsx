import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInput, NSelect } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useBpmnProperties, useFormSize } from '../../../composables'
import { uid, getDefinitions } from './eventHelpers'

export default defineComponent({
  name: 'SignalDefinitionFields',
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
    const { getModdle, updateModdleProperties } = useBpmnProperties(props)
    const selectedSignalId = ref<string | null>(null)
    const selectedSignalName = ref('')
    const signalOptions = ref<{ label: string; value: string }[]>([])

    function getEventDef() {
      return props.businessObject?.eventDefinitions?.[0]
    }

    function buildSignalOptions() {
      const definitions = getDefinitions(toRaw(props.businessObject))
      const elements =
        definitions?.rootElements?.filter((e: any) => e.$type === 'bpmn:Signal') || []
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
      if (!ed) return
      const moddle = getModdle()

      if (value === '__none__') {
        selectedSignalId.value = null
        selectedSignalName.value = ''
        updateModdleProperties({ signalRef: undefined }, ed)
        return
      }

      if (value === '__create__') {
        if (!moddle) return
        const id = uid()
        const name = id
        const newSignal = moddle.create('bpmn:Signal', { id, name })
        const definitions = getDefinitions(toRaw(props.businessObject))
        if (definitions && definitions.rootElements) {
          definitions.rootElements.push(newSignal)
        }
        selectedSignalId.value = id
        selectedSignalName.value = name
        updateModdleProperties({ signalRef: newSignal }, ed)
        buildSignalOptions()
        return
      }

      const definitions = getDefinitions(toRaw(props.businessObject))
      const sig = definitions?.rootElements?.find((e: any) => e.id === value)
      if (sig) {
        selectedSignalId.value = value
        selectedSignalName.value = sig.name || ''
        updateModdleProperties({ signalRef: sig }, ed)
      }
    }

    function onSignalNameChange(val: string | null) {
      selectedSignalName.value = val ?? ''
      const ed = getEventDef()
      const ref = ed?.signalRef
      if (ref) {
        updateModdleProperties({ name: val ?? '' }, ref)
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
            <div class={`mb-4px ${labelClass.value}`}>{t('bpmnPanel.fields.signalName')}</div>
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
