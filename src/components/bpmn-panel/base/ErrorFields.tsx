import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInput, NSelect, NButton, NEmpty } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { ExpressionField } from '.'

function getDefinitions(bo: any): any {
  let cur = bo
  while (cur) {
    if (cur.$type === 'bpmn:Definitions') return cur
    cur = cur.$parent
  }
  return null
}

function uid(): string {
  return `Error_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

interface ErrorItem {
  _key: number
  errorRefId: string | null
  name: string
  code: string
  message: string
  throwExpression: string
}

let keySeq = 0

function createDefaultError(): ErrorItem {
  return { _key: keySeq++, errorRefId: null, name: '', code: '', message: '', throwExpression: '' }
}

export default defineComponent({
  name: 'ErrorFields',
  props: {
    businessObject: { type: Object as PropType<any>, required: true },
    element: { type: Object as PropType<any>, required: true },
    bpmnModeler: { type: Object, required: true },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const items = ref<ErrorItem[]>([])
    const errorOptions = ref<{ label: string; value: string }[]>([])

    function getGlobalErrorOptions(): { label: string; value: string }[] {
      const definitions = getDefinitions(toRaw(props.businessObject))
      const elements = definitions?.rootElements?.filter(
        (e: any) => e.$type === 'bpmn:Error'
      ) || []
      return elements.map((el: any) => ({
        label: el.name || el.id || 'Unnamed',
        value: el.id,
      }))
    }

    function buildErrorOptions() {
      const existing = getGlobalErrorOptions()
      errorOptions.value = [
        { label: t('bpmnPanel.eventDef.none'), value: '__none__' },
        { label: t('bpmnPanel.eventDef.createNew'), value: '__create__' },
        ...existing,
      ]
    }

    function findPropertiesContainer(extensionElements: any): any {
      if (!extensionElements?.values) return null
      return extensionElements.values.find(
        (v: any) => v.$type === 'camunda:Properties'
      ) || null
    }

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) {
        items.value = []
        return
      }

      buildErrorOptions()

      const container = findPropertiesContainer(bo.extensionElements)
      const raw: any[] = container?.values || []
      const errorRefProps = raw.filter((p: any) => p.name?.startsWith('errorRef_'))

      items.value = errorRefProps.map((p: any) => {
        const idx = p.name.replace('errorRef_', '')
        const nameProp = raw.find((r: any) => r.name === `errorName_${idx}`)
        const codeProp = raw.find((r: any) => r.name === `errorCode_${idx}`)
        const msgProp = raw.find((r: any) => r.name === `errorMessage_${idx}`)
        const exprProp = raw.find((r: any) => r.name === `errorThrowExpression_${idx}`)
        return {
          _key: keySeq++,
          errorRefId: p.value || null,
          name: nameProp?.value || '',
          code: codeProp?.value || '',
          message: msgProp?.value || '',
          throwExpression: exprProp?.value || '',
        }
      })
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function save() {
      if (!props.bpmnModeler || !props.element) return
      const moddle = props.bpmnModeler.get('moddle')
      const modeling = props.bpmnModeler.get('modeling')
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

      container.values = (container.values || []).filter(
        (p: any) =>
          !p.name?.startsWith('errorRef_') &&
          !p.name?.startsWith('errorName_') &&
          !p.name?.startsWith('errorCode_') &&
          !p.name?.startsWith('errorMessage_') &&
          !p.name?.startsWith('errorThrowExpression_'),
      )

      items.value.forEach((item, i) => {
        if (!item.errorRefId) return
        container.values.push(
          moddle.create('camunda:Property', { name: `errorRef_${i}`, value: item.errorRefId }),
        )
        if (item.name)
          container.values.push(
            moddle.create('camunda:Property', { name: `errorName_${i}`, value: item.name }),
          )
        if (item.code)
          container.values.push(
            moddle.create('camunda:Property', { name: `errorCode_${i}`, value: item.code }),
          )
        if (item.message)
          container.values.push(
            moddle.create('camunda:Property', { name: `errorMessage_${i}`, value: item.message }),
          )
        if (item.throwExpression)
          container.values.push(
            moddle.create('camunda:Property', {
              name: `errorThrowExpression_${i}`,
              value: item.throwExpression,
            }),
          )
      })

      modeling.updateProperties(toRaw(props.element), {
        extensionElements: bo.extensionElements,
      })
    }

    function onErrorRefSelect(index: number, value: string) {
      if (value === '__none__') {
        const next = items.value.map((item, i) =>
          i === index ? { ...item, errorRefId: null, name: '', code: '' } : item,
        )
        items.value = next
        save()
        return
      }

      if (value === '__create__') {
        if (!props.bpmnModeler) return
        const moddle = props.bpmnModeler.get('moddle')
        const id = uid()
        const newError = moddle.create('bpmn:Error', { id, name: id, errorCode: '' })
        const rawBo = toRaw(props.businessObject)
        const definitions = getDefinitions(rawBo)
        if (definitions?.rootElements) {
          definitions.rootElements.push(newError)
        }
        buildErrorOptions()
        const next = items.value.map((item, i) =>
          i === index ? { ...item, errorRefId: id, name: id, code: '' } : item,
        )
        items.value = next
        save()
        return
      }

      const definitions = getDefinitions(toRaw(props.businessObject))
      const error = definitions?.rootElements?.find((e: any) => e.id === value)
      if (error) {
        const next = items.value.map((item, i) =>
          i === index
            ? { ...item, errorRefId: value, name: error.name || '', code: error.errorCode || '' }
            : item,
        )
        items.value = next
        save()
      }
    }

    function onNameChange(index: number, val: string | null) {
      const item = items.value[index]
      const next = items.value.map((item, i) =>
        i === index ? { ...item, name: val ?? '' } : item,
      )
      items.value = next
      save()

      if (item?.errorRefId && props.bpmnModeler && props.element) {
        const definitions = getDefinitions(toRaw(props.businessObject))
        const err = definitions?.rootElements?.find(
          (e: any) => e.$type === 'bpmn:Error' && e.id === item.errorRefId,
        )
        if (err) {
          const modeling = props.bpmnModeler.get('modeling')
          modeling.updateModdleProperties(toRaw(props.element), err, { name: val ?? '' })
        }
      }
    }

    function onCodeChange(index: number, val: string | null) {
      const item = items.value[index]
      const next = items.value.map((item, i) =>
        i === index ? { ...item, code: val ?? '' } : item,
      )
      items.value = next
      save()

      if (item?.errorRefId && props.bpmnModeler && props.element) {
        const definitions = getDefinitions(toRaw(props.businessObject))
        const err = definitions?.rootElements?.find(
          (e: any) => e.$type === 'bpmn:Error' && e.id === item.errorRefId,
        )
        if (err) {
          const modeling = props.bpmnModeler.get('modeling')
          modeling.updateModdleProperties(toRaw(props.element), err, { errorCode: val ?? '' })
        }
      }
    }

    function onMessageChange(index: number, val: string | null) {
      const next = items.value.map((item, i) =>
        i === index ? { ...item, message: val ?? '' } : item,
      )
      items.value = next
      save()
    }

    function onThrowExpressionChange(index: number, val: string) {
      const next = items.value.map((item, i) =>
        i === index ? { ...item, throwExpression: val } : item,
      )
      items.value = next
      save()
    }

    function add() {
      items.value = [...items.value, createDefaultError()]
      save()
    }

    function remove(index: number) {
      items.value = items.value.filter((_, i) => i !== index)
      save()
    }

    return () => {
      return (
        <div class="flex flex-col gap-8px">
          {items.value.length === 0 ? (
            <NButton size="tiny" onClick={add} class="w-full justify-center">
              + {t('bpmnPanel.buttons.addError')}
            </NButton>
          ) : (
            items.value.map((item, index) => (
              <div class="flex flex-col gap-4px p-10px border border-solid border-light_border dark:border-dark_border rounded-4px bg-#fafafa dark:bg-#1a1a1a">
                <div class="flex gap-8px items-center">
                  <NSelect
                    value={item.errorRefId || '__none__'}
                    onUpdateValue={(v: string | null) => onErrorRefSelect(index, v ?? '__none__')}
                    options={errorOptions.value}
                    size={props.formSize}
                    style="flex:1"
                  />
                  <NButton text type="error" size="tiny" onClick={() => remove(index)}>
                    {t('bpmnPanel.buttons.delete')}
                  </NButton>
                </div>
                <div class="flex gap-4px">
                  <div style="flex:1">
                    <div class="mb-2px text-12px text-#666">{t('bpmnPanel.fields.listenerClass')}</div>
                    <NInput
                      value={item.name}
                      onUpdateValue={(v: string | null) => onNameChange(index, v)}
                      placeholder={t('bpmnPanel.placeholders.errorRef')}
                      size={props.formSize}
                    />
                  </div>
                  <div style="flex:1">
                    <div class="mb-2px text-12px text-#666">{t('bpmnPanel.fields.errorCode')}</div>
                    <NInput
                      value={item.code}
                      onUpdateValue={(v: string | null) => onCodeChange(index, v)}
                      placeholder={t('bpmnPanel.placeholders.errorCode')}
                      size={props.formSize}
                    />
                  </div>
                </div>
                <div>
                  <div class="mb-2px text-12px text-#666">{t('bpmnPanel.fields.errorMessage')}</div>
                  <NInput
                    value={item.message}
                    onUpdateValue={(v: string | null) => onMessageChange(index, v)}
                    placeholder={t('bpmnPanel.placeholders.errorMessage')}
                    size={props.formSize}
                  />
                </div>
                <div>
                  <div class="mb-2px text-12px text-#666">{t('bpmnPanel.fields.errorThrowExpression')}</div>
                  <ExpressionField
                    value={item.throwExpression}
                    onUpdateValue={(v: string) => onThrowExpressionChange(index, v)}
                    formSize={props.formSize}
                  />
                </div>
              </div>
            ))
          )}
          {items.value.length > 0 && (
            <NButton size="tiny" onClick={add} class="w-full justify-center">
              + {t('bpmnPanel.buttons.addError')}
            </NButton>
          )}
        </div>
      )
    }
  },
})
