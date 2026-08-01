import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInput, NSelect } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useBpmnProperties, useFormSize } from '../../../composables'
import { HintTooltip } from '../base'
import { uid, getDefinitions } from './eventHelpers'

export default defineComponent({
  name: 'ErrorDefinitionFields',
  props: {
    // 当前元素的 BPMN 业务对象（BusinessObject），用于读写模型属性
    businessObject: { type: Object as PropType<any>, default: null },
    // 当前选中的 BPMN 图形元素
    element: { type: Object as PropType<any>, default: null },
    // bpmn-js 模型器实例，用于执行建模命令、读写模型
    bpmnModeler: { type: Object, default: null },
    // 表单控件尺寸：small / medium / large
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    // 是否显示变量事件配置
    showVariableEvents: { type: Boolean, default: false },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const { labelClass } = useFormSize(() => props.formSize)
    const { getModdle, updateModdleProperties } = useBpmnProperties(props)
    const selectedErrorId = ref<string | null>(null)
    const selectedErrorName = ref('')
    const selectedErrorCode = ref('')
    const selectedErrorMessage = ref('')
    const errorCodeVariable = ref('')
    const errorMessageVariable = ref('')
    const errorOptions = ref<{ label: string; value: string }[]>([])

    function getEventDef() {
      return props.businessObject?.eventDefinitions?.[0]
    }

    function getErrorRef(): any {
      const ed = getEventDef()
      return ed?.errorRef || null
    }

    function buildErrorOptions() {
      const definitions = getDefinitions(toRaw(props.businessObject))
      const elements = definitions?.rootElements?.filter((e: any) => e.$type === 'bpmn:Error') || []
      const opts: { label: string; value: string }[] = [
        { label: t('bpmnPanel.eventDef.none'), value: '__none__' },
        { label: t('bpmnPanel.eventDef.createNew'), value: '__create__' },
      ]
      for (const el of elements) {
        opts.push({ label: el.name || el.id || 'Unnamed', value: el.id })
      }
      errorOptions.value = opts
    }

    function syncFromModel() {
      const def = getEventDef()
      if (!def) return
      const ref = def.errorRef
      selectedErrorId.value = ref?.id || null
      selectedErrorName.value = ref?.name || ''
      selectedErrorCode.value = ref?.errorCode || ''
      selectedErrorMessage.value = ref?.get('camunda:errorMessage') || ''
      errorCodeVariable.value = def.get('camunda:errorCodeVariable') || ''
      errorMessageVariable.value = def.get('camunda:errorMessageVariable') || ''
      buildErrorOptions()
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true, deep: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function onErrorSelect(value: string) {
      const ed = getEventDef()
      if (!ed) return
      const moddle = getModdle()

      if (value === '__none__') {
        selectedErrorId.value = null
        selectedErrorName.value = ''
        selectedErrorCode.value = ''
        selectedErrorMessage.value = ''
        updateModdleProperties({ errorRef: undefined }, ed)
        return
      }

      if (value === '__create__') {
        if (!moddle) return
        const id = uid()
        const newError = moddle.create('bpmn:Error', { id, name: id })
        const definitions = getDefinitions(toRaw(props.businessObject))
        if (definitions && definitions.rootElements) {
          definitions.rootElements.push(newError)
        }
        selectedErrorId.value = id
        selectedErrorName.value = id
        selectedErrorCode.value = ''
        selectedErrorMessage.value = ''
        updateModdleProperties({ errorRef: newError }, ed)
        buildErrorOptions()
        return
      }

      const definitions = getDefinitions(toRaw(props.businessObject))
      const err = definitions?.rootElements?.find((e: any) => e.id === value)
      if (err) {
        selectedErrorId.value = value
        selectedErrorName.value = err.name || ''
        selectedErrorCode.value = err.errorCode || ''
        selectedErrorMessage.value = err.get('camunda:errorMessage') || ''
        updateModdleProperties({ errorRef: err }, ed)
      }
    }

    function onErrorNameChange(val: string | null) {
      selectedErrorName.value = val ?? ''
      const ed = getEventDef()
      const ref = ed?.errorRef
      if (ref) {
        updateModdleProperties({ name: val ?? '' }, ref)
        buildErrorOptions()
      }
    }

    function onErrorCodeChange(val: string | null) {
      selectedErrorCode.value = val ?? ''
      const ed = getEventDef()
      const ref = ed?.errorRef
      if (ref) {
        updateModdleProperties({ errorCode: val ?? '' }, ref)
      }
    }

    function onErrorMessageChange(val: string | null) {
      selectedErrorMessage.value = val ?? ''
      const ref = getErrorRef()
      if (ref) {
        updateModdleProperties({ 'camunda:errorMessage': val ?? '' }, ref)
      }
    }

    function onErrorCodeVariableChange(val: string | null) {
      errorCodeVariable.value = val ?? ''
      const ed = getEventDef()
      if (ed) {
        updateModdleProperties({ 'camunda:errorCodeVariable': val ?? '' }, ed)
      }
    }

    function onErrorMessageVariableChange(val: string | null) {
      errorMessageVariable.value = val ?? ''
      const ed = getEventDef()
      if (ed) {
        updateModdleProperties({ 'camunda:errorMessageVariable': val ?? '' }, ed)
      }
    }

    return () => (
      <div>
        <NSelect
          value={selectedErrorId.value}
          onUpdateValue={onErrorSelect}
          options={errorOptions.value}
          size={props.formSize}
          placeholder={t('bpmnPanel.placeholders.errorRef')}
        />
        {selectedErrorId.value && (
          <div class="mt-8px flex flex-col gap-8px">
            <div>
              <div class={`mb-4px ${labelClass.value}`}>{t('bpmnPanel.fields.errorName')}</div>
              <NInput
                value={selectedErrorName.value}
                onUpdateValue={onErrorNameChange}
                placeholder={t('bpmnPanel.fields.errorName')}
                size={props.formSize}
              />
            </div>
            <div>
              <div class={`mb-4px ${labelClass.value}`}>{t('bpmnPanel.fields.errorCode')}</div>
              <NInput
                value={selectedErrorCode.value}
                onUpdateValue={onErrorCodeChange}
                placeholder={t('bpmnPanel.placeholders.errorCode')}
                size={props.formSize}
              />
            </div>
            <div>
              <div class={`mb-4px ${labelClass.value}`}>{t('bpmnPanel.fields.errorMessage')}</div>
              <NInput
                value={selectedErrorMessage.value}
                onUpdateValue={onErrorMessageChange}
                placeholder={t('bpmnPanel.placeholders.errorMessage')}
                size={props.formSize}
              />
            </div>
            {props.showVariableEvents && (
              <>
                <div>
                  <HintTooltip
                    label={t('bpmnPanel.fields.errorCodeVariable')}
                    hint={t('bpmnPanel.fields.hintErrorCodeVariable')}
                  />
                  <NInput
                    value={errorCodeVariable.value}
                    onUpdateValue={onErrorCodeVariableChange}
                    size={props.formSize}
                    class="mt-4px"
                  />
                </div>
                <div>
                  <HintTooltip
                    label={t('bpmnPanel.fields.errorMessageVariable')}
                    hint={t('bpmnPanel.fields.hintErrorMessageVariable')}
                  />
                  <NInput
                    value={errorMessageVariable.value}
                    onUpdateValue={onErrorMessageVariableChange}
                    size={props.formSize}
                    class="mt-4px"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    )
  },
})
