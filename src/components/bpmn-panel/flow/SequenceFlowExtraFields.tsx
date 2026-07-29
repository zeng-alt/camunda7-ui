import { defineComponent, ref, watch, toRaw, computed, type PropType } from 'vue'
import { NSelect, NTabPane } from 'naive-ui'
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
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
  },
  setup(props) {
    const { t } = useCamundaI18n()

    const isDefault = computed(() => (props.element ? isDefaultFlow(props.element) : false))
    const conditionType = ref<'expression' | 'script'>('expression')
    const conditionExpr = ref<any>(null)

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) {
        conditionExpr.value = null
        return
      }
      const expr = bo.conditionExpression
      conditionExpr.value = expr || null
      conditionType.value = expr?.language ? 'script' : 'expression'
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function onConditionTypeChange(val: string | null) {
      const newType = (val as 'expression' | 'script') ?? 'expression'
      conditionType.value = newType
      if (!props.bpmnModeler || !props.element) return
      const modeling = props.bpmnModeler.get('modeling')
      const bo = props.businessObject
      if (!bo) return

      if (conditionExpr.value) {
        modeling.updateProperties(toRaw(props.element), { conditionExpression: undefined })
      }

      const moddle = props.bpmnModeler.get('moddle')
      const attrs: Record<string, any> = {}
      if (newType === 'script') attrs.language = 'js'
      const newExpr = moddle.create('bpmn:FormalExpression', attrs)
      conditionExpr.value = newExpr
      modeling.updateProperties(toRaw(props.element), { conditionExpression: newExpr })
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
          {conditionType.value === 'expression' && conditionExpr.value && (
            <div class="mt-12px">
              <div class="mb-4px text-12px text-#666">
                {t('bpmnPanel.fields.conditionExpression')}
              </div>
              <ExpressionField
                businessObject={conditionExpr.value}
                element={props.element}
                bpmnModeler={props.bpmnModeler}
                propertyKey="body"
                nested
                textarea
                formSize={props.formSize}
              />
            </div>
          )}
          {conditionType.value === 'script' && conditionExpr.value && (
            <div class="mt-12px">
              <ScriptFields
                businessObject={conditionExpr.value}
                element={props.element}
                bpmnModeler={props.bpmnModeler}
                scriptFormatPropertyKey="language"
                scriptValuePropertyKey="body"
                nested
                formSize={props.formSize}
              />
            </div>
          )}
        </div>
      </NTabPane>
    )
  },
})
