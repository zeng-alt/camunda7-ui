import { defineComponent, ref, watch, type PropType } from 'vue'
import { NInput, NSelect } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useBpmnProperties, useFormSize } from '../../../composables'

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
    // 脚本格式
    scriptFormat: { type: String, default: 'js' },
    // 脚本内容
    scriptValue: { type: String, default: '' },
    // 脚本格式变更回调
    onUpdateScriptFormat: { type: Function as PropType<(val: string) => void>, default: null },
    // 脚本内容变更回调
    onUpdateScriptValue: { type: Function as PropType<(val: string) => void>, default: null },
    // 表单控件尺寸：small / medium / large
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    // 是否紧凑模式
    compact: { type: Boolean, default: false },
    // 当前元素的 BPMN 业务对象（BusinessObject），用于读写模型属性
    businessObject: { type: Object as PropType<any>, default: null },
    // 当前选中的 BPMN 图形元素
    element: { type: Object as PropType<any>, default: null },
    // bpmn-js 模型器实例，用于执行建模命令、读写模型
    bpmnModeler: { type: Object, default: null },
    // 脚本格式属性名（业务对象属性名）
    scriptFormatPropertyKey: { type: String, default: 'scriptFormat' },
    // 脚本内容属性名（业务对象属性名）
    scriptValuePropertyKey: { type: String, default: 'scriptValue' },
    // 是否为嵌套渲染（用于子流程等内部面板场景）
    nested: { type: Boolean, default: false },
    // 是否显示结果变量输入框
    showResultVariable: { type: Boolean, default: false },
    // 结果变量名
    resultVariable: { type: String, default: '' },
    // 结果变量变更回调
    onUpdateResultVariable: { type: Function as PropType<(val: string) => void>, default: null },
    // 结果变量属性名（业务对象属性名）
    resultVariablePropertyKey: { type: String, default: '' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const { labelClass } = useFormSize(() => props.formSize)
    const { updateProperties, updateModdleProperties } = useBpmnProperties(props)
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
      const attrs = { [key]: val || undefined }
      if (props.nested) {
        updateModdleProperties(attrs, props.businessObject)
      } else {
        updateProperties(attrs)
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

    const displayFormat = () => (isAuto() ? localFormat.value : props.scriptFormat)
    const displayValue = () => (isAuto() ? localValue.value : props.scriptValue)
    const displayResultVariable = () =>
      isResultVarAuto() ? localResultVariable.value : props.resultVariable

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
              <div class={`mb-4px ${labelClass.value}`}>{t('bpmnPanel.fields.scriptFormat')}</div>
              <NSelect
                value={displayFormat()}
                onUpdateValue={(v: string | null) => onFormatChange(v ?? 'js')}
                options={scriptFormatOptions}
                size={props.formSize}
              />
            </div>
          )}
          <div>
            {!props.compact && (
              <div class={`mb-4px ${labelClass.value}`}>{t('bpmnPanel.fields.scriptValue')}</div>
            )}
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
              <div class={`mb-4px ${labelClass.value}`}>{t('bpmnPanel.fields.resultVariable')}</div>
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
      <div class={`flex flex-col gap-${props.compact ? '4px' : '8px'}`}>{renderBody()}</div>
    )
  },
})
