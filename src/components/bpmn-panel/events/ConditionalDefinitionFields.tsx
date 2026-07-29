import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInput, NSelect } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { ExpressionField, ScriptFields, HintTooltip } from '../base'

const variableEventOptions = [
  { label: 'create', value: 'create' },
  { label: 'update', value: 'update' },
  { label: 'delete', value: 'delete' },
]

export default defineComponent({
  name: 'ConditionalDefinitionFields',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    showVariableEvents: { type: Boolean, default: false },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const conditionType = ref<'none' | 'expression' | 'script'>('none')
    const variableName = ref('')
    const conditionModdle = ref<any>(null)
    const variableEvents = ref<string[]>([])

    function getModeler() {
      return props.bpmnModeler
    }

    function getEventDef() {
      return props.businessObject?.eventDefinitions?.[0]
    }

    function updateDefProperty(key: string, value: any) {
      const ed = getEventDef()
      if (!getModeler() || !props.element || !ed) return
      const modeling = getModeler().get('modeling')
      modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), { [key]: value })
    }

    function syncFromModel() {
      const def = getEventDef()
      if (!def) return
      variableName.value = def.variableName || ''
      conditionModdle.value = def.condition || null
      if (!def.condition) {
        conditionType.value = 'none'
      } else if (def.condition.language) {
        conditionType.value = 'script'
      } else {
        conditionType.value = 'expression'
      }
      const raw = def['camunda:variableEvents'] || def.variableEvents || ''
      variableEvents.value = raw
        ? raw
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : []
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true, deep: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function onVariableNameChange(val: string | null) {
      variableName.value = val ?? ''
      updateDefProperty('variableName', val ?? '')
    }

    function onConditionTypeChange(val: string | null) {
      const t = (val as 'none' | 'expression' | 'script') ?? 'none'
      conditionType.value = t
      if (t === 'none') {
        conditionModdle.value = null
        updateDefProperty('condition', undefined)
        return
      }
      if (conditionModdle.value) return
      const ed = getEventDef()
      if (!getModeler() || !props.element || !ed) return
      const modeling = getModeler().get('modeling')
      const moddle = getModeler().get('moddle')
      const attrs: Record<string, any> = {}
      if (t === 'script') attrs.language = 'js'
      const expr = moddle.create('bpmn:FormalExpression', attrs)
      conditionModdle.value = expr
      modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), { condition: expr })
    }

    function onVariableEventsChange(vals: string[] | null) {
      variableEvents.value = vals ?? []
      updateDefProperty('variableEvents', (vals ?? []).join(',') || undefined)
    }

    return () => (
      <div>
        <div class="mb-8px">
          <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.variableName')}</div>
          <NInput
            value={variableName.value}
            onUpdateValue={onVariableNameChange}
            placeholder={t('bpmnPanel.placeholders.variableName')}
            size={props.formSize}
          />
        </div>
        {props.showVariableEvents && (
          <div class="mb-8px">
            <div class="mb-4px text-12px">
              <HintTooltip
                label={t('bpmnPanel.fields.variableEvents')}
                hintHtml={t('bpmnPanel.tooltips.variableEvents')}
              />
            </div>
            <NSelect
              value={variableEvents.value}
              onUpdateValue={onVariableEventsChange}
              options={variableEventOptions}
              size={props.formSize}
              multiple
              clearable
            />
          </div>
        )}
        <div class="mb-8px">
          <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.conditionType')}</div>
          <NSelect
            value={conditionType.value}
            onUpdateValue={onConditionTypeChange}
            options={[
              { label: 'None', value: 'none' },
              { label: 'Expression', value: 'expression' },
              { label: 'Script', value: 'script' },
            ]}
            size={props.formSize}
          />
        </div>
        {conditionType.value === 'expression' && conditionModdle.value && (
          <ExpressionField
            businessObject={conditionModdle.value}
            element={props.element}
            bpmnModeler={props.bpmnModeler}
            propertyKey="body"
            nested
            textarea
            formSize={props.formSize}
          />
        )}
        {conditionType.value === 'script' && conditionModdle.value && (
          <ScriptFields
            businessObject={conditionModdle.value}
            element={props.element}
            bpmnModeler={props.bpmnModeler}
            scriptFormatPropertyKey="language"
            scriptValuePropertyKey="body"
            nested
            formSize={props.formSize}
          />
        )}
      </div>
    )
  },
})
