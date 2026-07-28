import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { useCamundaI18n } from '../../../locales'
import type { ExtraFieldTab } from '../base'
import { ScriptFields } from '../base'

export const scriptTaskTabs: ExtraFieldTab[] = [
  { name: 'script', labelKey: 'bpmnPanel.tabs.script' },
]

export default defineComponent({
  name: 'ScriptTaskExtraFields',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    tabName: { type: String, default: 'script' },
  },
  setup(props) {
    const { t } = useCamundaI18n()

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
      if (!props.bpmnModeler || !props.element) return
      const modeling = (props.bpmnModeler as any).get('modeling')
      modeling.updateProperties(toRaw(props.element), { scriptFormat: val || undefined })
    }

    function onScriptValueChange(val: string | null) {
      const text = val ?? ''
      scriptValue.value = text
      if (!props.bpmnModeler || !props.element) return
      const modeling = (props.bpmnModeler as any).get('modeling')
      const bo = props.businessObject
      if (!bo) return

      if (bo.script) {
        if (text) {
          modeling.updateModdleProperties(toRaw(props.element), toRaw(bo.script), { body: text })
        } else {
          modeling.updateProperties(toRaw(props.element), { script: undefined })
        }
      } else if (text) {
        const moddle = (props.bpmnModeler as any).get('moddle')
        const newScript = moddle.create('bpmn:Script', { body: text })
        modeling.updateProperties(toRaw(props.element), { script: newScript })
      }
    }

    function onResultVariableChange(val: string) {
      resultVariable.value = val
      if (!props.bpmnModeler || !props.element) return
      const modeling = (props.bpmnModeler as any).get('modeling')
      modeling.updateProperties(toRaw(props.element), { resultVariable: val || undefined })
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
