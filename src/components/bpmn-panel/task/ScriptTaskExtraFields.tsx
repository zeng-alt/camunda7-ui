import { defineComponent, ref, watch, type PropType } from 'vue'
import { useCamundaI18n } from '../../../locales'
import { useBpmnProperties } from '../../../composables'
import type { ExtraFieldTab } from '../base'
import { ScriptFields } from '../base'

export const scriptTaskTabs: ExtraFieldTab[] = [
  { name: 'script', labelKey: 'bpmnPanel.tabs.script' },
]

export default defineComponent({
  name: 'ScriptTaskExtraFields',
  props: {
    // 当前元素的 BPMN 业务对象（BusinessObject），用于读写模型属性
    businessObject: { type: Object as PropType<any>, default: null },
    // 当前选中的 BPMN 图形元素
    element: { type: Object as PropType<any>, default: null },
    // bpmn-js 模型器实例，用于执行建模命令、读写模型
    bpmnModeler: { type: Object, default: null },
    // 表单控件尺寸：small / medium / large
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    // 所属 tab 名称
    tabName: { type: String, default: 'script' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const { getModdle, updateProperties, updateModdleProperties } = useBpmnProperties(props)

    const scriptFormat = ref('js')
    const scriptValue = ref('')
    const resultVariable = ref('')

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) return
      scriptFormat.value = bo.scriptFormat || 'js'
      scriptValue.value = bo.script?.body || ''
      resultVariable.value = bo.resultVariable || ''
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function onScriptFormatChange(val: string) {
      scriptFormat.value = val
      updateProperties({ scriptFormat: val || undefined })
    }

    function onScriptValueChange(val: string | null) {
      const text = val ?? ''
      scriptValue.value = text
      const bo = props.businessObject
      if (!bo) return

      if (bo.script) {
        if (text) {
          updateModdleProperties({ body: text }, bo.script)
        } else {
          updateProperties({ script: undefined })
        }
      } else if (text) {
        const moddle = getModdle()
        if (!moddle) return
        const newScript = moddle.create('bpmn:Script', { body: text })
        updateProperties({ script: newScript })
      }
    }

    function onResultVariableChange(val: string) {
      resultVariable.value = val
      updateProperties({ resultVariable: val || undefined })
    }

    return () => {
      if (props.tabName !== 'script') return null

      return (
        <div class="pt-8px">
          <ScriptFields
            scriptFormat={scriptFormat.value}
            onUpdateScriptFormat={onScriptFormatChange}
            scriptValue={scriptValue.value}
            onUpdateScriptValue={onScriptValueChange}
            showResultVariable
            resultVariable={resultVariable.value}
            onUpdateResultVariable={onResultVariableChange}
            formSize={props.formSize}
          />
        </div>
      )
    }
  },
})
