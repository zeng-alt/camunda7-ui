import { defineComponent, ref, watch, toRaw, computed, type PropType } from 'vue'
import { NInput, NSelect, NTabPane } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { ScriptFields, ExpressionField } from '../base'

function isDefaultFlow(sequenceFlow: any) {
  const source = sequenceFlow.source
  if (!source) return false
  const businessObject = source.businessObject
  return businessObject.default && businessObject.default.id === sequenceFlow.id
}

const conditionTypeOptions = [
  { label: 'Expression', value: 'expression' },
  { label: 'Script', value: 'script' },
]

export default defineComponent({
  name: 'SequenceFlowExtraFields',
  props: {
    businessObject: {
      type: Object as PropType<any>,
      default: null,
    },
    element: {
      type: Object as PropType<any>,
      default: null,
    },
    bpmnModeler: {
      type: Object,
      default: null,
    },
    formSize: {
      type: String as PropType<'small' | 'medium' | 'large'>,
      default: 'small',
    },
  },
  setup(props) {
    const { t } = useCamundaI18n()

    const isDefault = computed(() => props.element ? isDefaultFlow(props.element) : false)
    const conditionType = ref<'expression' | 'script'>('expression')
    const expression = ref('')
    const scriptFormat = ref('js')
    const scriptValue = ref('')

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) return
      const expr = bo.conditionExpression
      if (!expr) {
        conditionType.value = 'expression'
        expression.value = ''
        scriptFormat.value = 'js'
        scriptValue.value = ''
        return
      }
      if (expr.language) {
        conditionType.value = 'script'
        scriptFormat.value = expr.language
        scriptValue.value = expr.body || ''
        expression.value = ''
      } else {
        conditionType.value = 'expression'
        expression.value = expr.body || expr || ''
        scriptFormat.value = 'js'
        scriptValue.value = ''
      }
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function save() {
      if (!props.bpmnModeler || !props.element) return
      const modeling = props.bpmnModeler.get('modeling')
      const bo = props.businessObject
      if (!bo) return

      const hasContent = conditionType.value === 'expression' ? expression.value : scriptValue.value
      if (!hasContent) {
        modeling.updateProperties(toRaw(props.element), { conditionExpression: undefined })
        return
      }

      const moddle = props.bpmnModeler.get('moddle')
      const attrs: Record<string, any> = {}

      if (conditionType.value === 'script') {
        attrs.language = scriptFormat.value
        attrs.body = scriptValue.value
      } else {
        attrs.body = expression.value
      }

      const formalExpression = moddle.create('bpmn:FormalExpression', attrs)
      modeling.updateProperties(toRaw(props.element), { conditionExpression: formalExpression })
    }

    function onConditionTypeChange(val: string | null) {
      conditionType.value = (val as 'expression' | 'script') ?? 'expression'
      save()
    }

    function onExpressionChange(val: string | null) {
      expression.value = val ?? ''
      save()
    }

    function onScriptFormatChange(val: string | null) {
      scriptFormat.value = val ?? 'js'
      save()
    }

    function onScriptValueChange(val: string | null) {
      scriptValue.value = val ?? ''
      save()
    }

    return () => (
      <NTabPane name="sequenceFlow" tab={t('bpmnPanel.tabs.sequenceFlow')}>
        <div class="pt-8px">
          {isDefault.value && (
            <div class="mt-4px mb-8px flex items-center gap-4px text-12px text-#fa8c16">
              <span>{t('bpmnPanel.fields.defaultFlow')}</span>
            </div>
          )}
          <div class="mt-12px">
            <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.conditionType')}</div>
            <NSelect
              value={conditionType.value}
              onUpdateValue={onConditionTypeChange}
              options={conditionTypeOptions}
              size={props.formSize}
            />
          </div>
          {conditionType.value === 'expression' ? (
            <div class="mt-12px">
              <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.conditionExpression')}</div>
              <ExpressionField
                value={expression.value}
                onUpdateValue={onExpressionChange}
                formSize={props.formSize}
                textarea
              />
            </div>
          ) : (
            <div class="mt-12px">
              <ScriptFields
                scriptFormat={scriptFormat.value}
                scriptValue={scriptValue.value}
                onUpdateScriptFormat={onScriptFormatChange}
                onUpdateScriptValue={onScriptValueChange}
                formSize={props.formSize}
              />
            </div>
          )}
        </div>
      </NTabPane>
    )
  },
})
