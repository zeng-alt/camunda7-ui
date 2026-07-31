import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInput, NSelect, NButton } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useBpmnProperties, useFormSize } from '../../../composables'
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

function defUid(): string {
  return `ErrorEventDefinition_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
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
    // 当前元素的 BPMN 业务对象（BusinessObject），用于读写模型属性
    businessObject: { type: Object as PropType<any>, required: true },
    // 当前选中的 BPMN 图形元素
    element: { type: Object as PropType<any>, required: true },
    // bpmn-js 模型器实例，用于执行建模命令、读写模型
    bpmnModeler: { type: Object, required: true },
    // 表单控件尺寸：small / medium / large
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const { labelClass } = useFormSize(() => props.formSize)
    const { getModdle, getOrCreateExtensionElements, updateProperties, updateModdleProperties } =
      useBpmnProperties(props)
    const items = ref<ErrorItem[]>([])
    const errorOptions = ref<{ label: string; value: string }[]>([])

    function getGlobalErrorOptions(): { label: string; value: string }[] {
      const definitions = getDefinitions(toRaw(props.businessObject))
      const elements = definitions?.rootElements?.filter((e: any) => e.$type === 'bpmn:Error') || []
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

    function findErrorRootById(id: string): any {
      const definitions = getDefinitions(toRaw(props.businessObject))
      return definitions?.rootElements?.find((e: any) => e.$type === 'bpmn:Error' && e.id === id)
    }

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) {
        items.value = []
        return
      }

      buildErrorOptions()

      const ee = bo.extensionElements
      const defs = ee?.values?.filter((v: any) => v.$type === 'camunda:ErrorEventDefinition') || []

      items.value = defs.map((def: any) => {
        const ref = def.errorRef
        return {
          _key: keySeq++,
          errorRefId: ref?.id || null,
          name: ref?.name || '',
          code: ref?.errorCode || '',
          message: ref?.get('camunda:errorMessage') || '',
          throwExpression: def.get('expression') || '',
        }
      })
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function save() {
      const moddle = getModdle()
      const ee = getOrCreateExtensionElements()
      if (!moddle || !ee) return

      const others = (ee.values || []).filter(
        (v: any) => v.$type !== 'camunda:ErrorEventDefinition',
      )

      items.value.forEach((item) => {
        if (!item.errorRefId) return

        const err = findErrorRootById(item.errorRefId)
        const attrs: Record<string, any> = {
          id: defUid(),
        }
        if (err) {
          attrs.errorRef = err
        }
        if (item.throwExpression) {
          attrs.expression = item.throwExpression
        }
        const def = moddle.create('camunda:ErrorEventDefinition', attrs)
        others.push(def)
      })

      ee.values = others
      updateProperties({ extensionElements: ee })
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
        const moddle = getModdle()
        if (!moddle) return
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
      const next = items.value.map((item, i) => (i === index ? { ...item, name: val ?? '' } : item))
      items.value = next
      save()

      if (item?.errorRefId) {
        const err = findErrorRootById(item.errorRefId)
        if (err) {
          updateModdleProperties({ name: val ?? '' }, err)
        }
      }
    }

    function onCodeChange(index: number, val: string | null) {
      const item = items.value[index]
      const next = items.value.map((item, i) => (i === index ? { ...item, code: val ?? '' } : item))
      items.value = next
      save()

      if (item?.errorRefId) {
        const err = findErrorRootById(item.errorRefId)
        if (err) {
          updateModdleProperties({ errorCode: val ?? '' }, err)
        }
      }
    }

    function onMessageChange(index: number, val: string | null) {
      const item = items.value[index]
      const next = items.value.map((item, i) =>
        i === index ? { ...item, message: val ?? '' } : item,
      )
      items.value = next
      save()

      if (item?.errorRefId) {
        const err = findErrorRootById(item.errorRefId)
        if (err) {
          updateModdleProperties({ 'camunda:errorMessage': val ?? '' }, err)
        }
      }
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
                    <div class={`mb-2px ${labelClass}`}>{t('bpmnPanel.fields.listenerClass')}</div>
                    <NInput
                      value={item.name}
                      onUpdateValue={(v: string | null) => onNameChange(index, v)}
                      placeholder={t('bpmnPanel.placeholders.errorRef')}
                      size={props.formSize}
                    />
                  </div>
                  <div style="flex:1">
                    <div class={`mb-2px ${labelClass}`}>{t('bpmnPanel.fields.errorCode')}</div>
                    <NInput
                      value={item.code}
                      onUpdateValue={(v: string | null) => onCodeChange(index, v)}
                      placeholder={t('bpmnPanel.placeholders.errorCode')}
                      size={props.formSize}
                    />
                  </div>
                </div>
                <div>
                  <div class={`mb-2px ${labelClass}`}>{t('bpmnPanel.fields.errorMessage')}</div>
                  <NInput
                    value={item.message}
                    onUpdateValue={(v: string | null) => onMessageChange(index, v)}
                    placeholder={t('bpmnPanel.placeholders.errorMessage')}
                    size={props.formSize}
                  />
                </div>
                <div>
                  <div class={`mb-2px ${labelClass}`}>
                    {t('bpmnPanel.fields.errorThrowExpression')}
                  </div>
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
