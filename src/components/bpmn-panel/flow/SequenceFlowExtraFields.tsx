import { defineComponent, ref, watch, toRaw, computed, type PropType } from 'vue'
import { NSelect } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import type { ExtraFieldTab } from '../base'
import { ScriptFields, ExpressionField } from '../base'

export const sequenceFlowTabs: ExtraFieldTab[] = [
  { name: 'sequenceFlow', labelKey: 'bpmnPanel.tabs.sequenceFlow' },
]

function isDefaultFlow(sequenceFlow: any) {
  const source = sequenceFlow.source
  if (!source) return false
  const businessObject = source.businessObject
  return businessObject.default && businessObject.default.id === sequenceFlow.id
}

const conditionTypeOptions = [
  { label: 'None', value: 'none' },
  { label: 'Expression', value: 'expression' },
  { label: 'Script', value: 'script' },
]

export default defineComponent({
  name: 'SequenceFlowExtraFields',
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
    tabName: { type: String, default: 'sequenceFlow' },
  },
  setup(props) {
    const { t } = useCamundaI18n()

    const isDefault = computed(() => (props.element ? isDefaultFlow(props.element) : false))
    const conditionType = ref<'none' | 'expression' | 'script'>('none')
    const conditionExpr = ref<any>(null)

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) {
        conditionExpr.value = null
        conditionType.value = 'none'
        return
      }
      const expr = bo.conditionExpression
      conditionExpr.value = expr || null
      conditionType.value = expr?.language ? 'script' : expr ? 'expression' : 'none'
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function onConditionTypeChange(val: string | null) {
      const newType = (val as 'none' | 'expression' | 'script') ?? 'none'
      conditionType.value = newType
      if (!props.bpmnModeler || !props.element) return
      const modeling = props.bpmnModeler.get('modeling')

      if (newType === 'none') {
        conditionExpr.value = null
        modeling.updateProperties(toRaw(props.element), { conditionExpression: undefined })
        return
      }

      const moddle = props.bpmnModeler.get('moddle')
      const attrs: Record<string, any> = {}
      if (newType === 'script') attrs.language = 'js'
      const newExpr = moddle.create('bpmn:FormalExpression', attrs)
      conditionExpr.value = newExpr
      modeling.updateProperties(toRaw(props.element), { conditionExpression: newExpr })
    }

    return () => (
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
    )
  },
})
