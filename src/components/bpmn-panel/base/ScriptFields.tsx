import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInput, NSelect } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'

const scriptFormatOptions = [
  { label: 'JavaScript (js)', value: 'js' },
  { label: 'Groovy', value: 'groovy' },
  { label: 'Python', value: 'python' },
  { label: 'Ruby', value: 'ruby' },
  { label: 'JRuby', value: 'jruby' },
  { label: 'BeanShell', value: 'beanshell' },
]

export { scriptFormatOptions }

export default defineComponent({
  name: 'ScriptFields',
  props: {
    scriptFormat: { type: String, default: 'js' },
    scriptValue: { type: String, default: '' },
    onUpdateScriptFormat: { type: Function as PropType<(val: string) => void>, default: null },
    onUpdateScriptValue: { type: Function as PropType<(val: string) => void>, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    compact: { type: Boolean, default: false },
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    scriptFormatPropertyKey: { type: String, default: 'scriptFormat' },
    scriptValuePropertyKey: { type: String, default: 'scriptValue' },
    nested: { type: Boolean, default: false },
    showResultVariable: { type: Boolean, default: false },
    resultVariable: { type: String, default: '' },
    onUpdateResultVariable: { type: Function as PropType<(val: string) => void>, default: null },
    resultVariablePropertyKey: { type: String, default: '' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const localFormat = ref('js')
    const localValue = ref('')
    const localResultVariable = ref('')

    const isAuto = () => props.businessObject && props.element && props.bpmnModeler
    const isResultVarAuto = () => props.businessObject && props.resultVariablePropertyKey

    function syncFromModel() {
      if (!isAuto()) return
      const bo = props.businessObject
      if (!bo) return
      localFormat.value = bo[props.scriptFormatPropertyKey] || 'js'
      localValue.value = bo[props.scriptValuePropertyKey] || ''
      if (isResultVarAuto()) localResultVariable.value = bo[props.resultVariablePropertyKey] || ''
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function saveProp(key: string, val: any) {
      if (!props.bpmnModeler || !props.element) return
      const modeling = (props.bpmnModeler as any).get('modeling')
      const attrs = { [key]: val || undefined }
      if (props.nested) {
        modeling.updateModdleProperties(toRaw(props.element), toRaw(props.businessObject), attrs)
      } else {
        modeling.updateProperties(toRaw(props.element), attrs)
      }
    }

    function onFormatChange(val: string) {
      if (isAuto()) {
        localFormat.value = val
        saveProp(props.scriptFormatPropertyKey, val)
      } else if (props.onUpdateScriptFormat) {
        props.onUpdateScriptFormat(val)
      }
    }

    function onValueChange(val: string) {
      if (isAuto()) {
        localValue.value = val
        saveProp(props.scriptValuePropertyKey, val)
      } else if (props.onUpdateScriptValue) {
        props.onUpdateScriptValue(val)
      }
    }

    function onResultVariableChange(val: string) {
      if (isResultVarAuto()) {
        localResultVariable.value = val
        saveProp(props.resultVariablePropertyKey, val)
      } else if (props.onUpdateResultVariable) {
        props.onUpdateResultVariable(val)
      }
    }

    const displayFormat = () => isAuto() ? localFormat.value : props.scriptFormat
    const displayValue = () => isAuto() ? localValue.value : props.scriptValue
    const displayResultVariable = () => isResultVarAuto() ? localResultVariable.value : props.resultVariable

    function renderBody() {
      return (
        <>
          {props.compact ? (
            <div class="flex gap-8px items-center">
              <span class="text-12px text-#888">{t('bpmnPanel.fields.scriptFormat')}:</span>
              <NSelect
                value={displayFormat()}
                onUpdateValue={(v: string | null) => onFormatChange(v ?? 'js')}
                options={scriptFormatOptions}
                size={props.formSize}
                style="width:140px"
              />
            </div>
          ) : (
            <div>
              <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.scriptFormat')}</div>
              <NSelect
                value={displayFormat()}
                onUpdateValue={(v: string | null) => onFormatChange(v ?? 'js')}
                options={scriptFormatOptions}
                size={props.formSize}
              />
            </div>
          )}
          <div>
            {!props.compact && <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.scriptValue')}</div>}
            <NInput
              value={displayValue()}
              onUpdateValue={(v: string | null) => onValueChange(v ?? '')}
              placeholder={t('bpmnPanel.placeholders.listenerScript')}
              size={props.formSize}
              type="textarea"
              rows={3}
            />
          </div>
          {props.showResultVariable && (
            <div>
              <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.resultVariable')}</div>
              <NInput
                value={displayResultVariable()}
                onUpdateValue={(v: string | null) => onResultVariableChange(v ?? '')}
                size={props.formSize}
              />
            </div>
          )}
        </>
      )
    }

    return () => (
      <div class={`flex flex-col gap-${props.compact ? '4px' : '8px'}`}>
        {renderBody()}
      </div>
    )
  },
})
