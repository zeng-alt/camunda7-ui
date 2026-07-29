import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInput, NSelect } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { uid, getDefinitions } from './eventHelpers'

function findPropertiesContainer(extensionElements: any): any {
  if (!extensionElements?.values) return null
  return extensionElements.values.find((v: any) => v.$type === 'camunda:Properties') || null
}

export default defineComponent({
  name: 'ErrorDefinitionFields',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const selectedErrorId = ref<string | null>(null)
    const selectedErrorName = ref('')
    const selectedErrorCode = ref('')
    const selectedErrorMessage = ref('')
    const errorOptions = ref<{ label: string; value: string }[]>([])

    function getModeler() {
      return props.bpmnModeler
    }

    function getEventDef() {
      return props.businessObject?.eventDefinitions?.[0]
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

    function loadMessageFromProperties() {
      const bo = props.businessObject
      if (!bo || !bo.extensionElements) {
        selectedErrorMessage.value = ''
        return
      }
      const container = findPropertiesContainer(bo.extensionElements)
      if (!container) {
        selectedErrorMessage.value = ''
        return
      }
      const prop = container.values?.find((p: any) => p.name === 'errorMessage')
      selectedErrorMessage.value = prop?.value || ''
    }

    function saveMessageToProperties(msg: string) {
      if (!getModeler() || !props.element) return
      const moddle = getModeler().get('moddle')
      const modeling = getModeler().get('modeling')
      const bo = props.businessObject
      if (!bo) return

      if (!bo.extensionElements) {
        bo.extensionElements = moddle.create('bpmn:ExtensionElements', { values: [] })
      }

      let container = findPropertiesContainer(bo.extensionElements)
      if (!container) {
        container = moddle.create('camunda:Properties')
        bo.extensionElements.get('values').push(container)
      }

      const others = (container.values || []).filter((p: any) => p.name !== 'errorMessage')
      if (msg) {
        others.push(moddle.create('camunda:Property', { name: 'errorMessage', value: msg }))
      }
      container.values = others
      modeling.updateProperties(toRaw(props.element), {
        extensionElements: bo.extensionElements,
      })
    }

    function syncFromModel() {
      const def = getEventDef()
      if (!def) return
      const ref = def.errorRef
      selectedErrorId.value = ref?.id || null
      selectedErrorName.value = ref?.name || ''
      selectedErrorCode.value = ref?.errorCode || ''
      loadMessageFromProperties()
      buildErrorOptions()
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true, deep: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function onErrorSelect(value: string) {
      const ed = getEventDef()
      if (!getModeler() || !props.element || !ed) return
      const modeling = getModeler().get('modeling')
      const moddle = getModeler().get('moddle')

      if (value === '__none__') {
        selectedErrorId.value = null
        selectedErrorName.value = ''
        selectedErrorCode.value = ''
        selectedErrorMessage.value = ''
        modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), { errorRef: undefined })
        return
      }

      if (value === '__create__') {
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
        modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), { errorRef: newError })
        buildErrorOptions()
        return
      }

      const definitions = getDefinitions(toRaw(props.businessObject))
      const err = definitions?.rootElements?.find((e: any) => e.id === value)
      if (err) {
        selectedErrorId.value = value
        selectedErrorName.value = err.name || ''
        selectedErrorCode.value = err.errorCode || ''
        modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), { errorRef: err })
      }
    }

    function onErrorNameChange(val: string | null) {
      selectedErrorName.value = val ?? ''
      const ed = getEventDef()
      const ref = ed?.errorRef
      if (ref && getModeler() && props.element) {
        const modeling = getModeler().get('modeling')
        modeling.updateModdleProperties(toRaw(props.element), ref, { name: val ?? '' })
        buildErrorOptions()
      }
    }

    function onErrorCodeChange(val: string | null) {
      selectedErrorCode.value = val ?? ''
      const ed = getEventDef()
      const ref = ed?.errorRef
      if (ref && getModeler() && props.element) {
        const modeling = getModeler().get('modeling')
        modeling.updateModdleProperties(toRaw(props.element), ref, { errorCode: val ?? '' })
      }
    }

    function onErrorMessageChange(val: string | null) {
      selectedErrorMessage.value = val ?? ''
      saveMessageToProperties(val ?? '')
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
          <div class="mt-8px">
            <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.errorName')}</div>
            <NInput
              value={selectedErrorName.value}
              onUpdateValue={onErrorNameChange}
              placeholder={t('bpmnPanel.fields.errorName')}
              size={props.formSize}
            />
            <div class="mt-8px mb-4px text-12px text-#666">{t('bpmnPanel.fields.errorCode')}</div>
            <NInput
              value={selectedErrorCode.value}
              onUpdateValue={onErrorCodeChange}
              placeholder={t('bpmnPanel.fields.errorCode')}
              size={props.formSize}
            />
            <div class="mt-8px mb-4px text-12px text-#666">
              {t('bpmnPanel.fields.errorMessage')}
            </div>
            <NInput
              value={selectedErrorMessage.value}
              onUpdateValue={onErrorMessageChange}
              placeholder={t('bpmnPanel.fields.errorMessage')}
              size={props.formSize}
            />
          </div>
        )}
      </div>
    )
  },
})
