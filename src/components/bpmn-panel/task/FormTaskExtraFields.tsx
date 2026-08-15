import { defineComponent, ref, watch, computed, type PropType } from 'vue'
import {
  NButton,
  NInput,
  NSelect,
  NEmpty,
  NCascader,
  NSwitch,
  NInputNumber,
  NDatePicker,
  type SelectOption,
} from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useBpmnProperties, useFormSchema, useCamundaLookups } from '../../../composables'
import {
  buildCascaderOptions,
  resolveFieldByPath,
  storedPathToCascaderValue,
  cascaderValueToStoredPath,
  getDatePickerType,
  formatDate,
  parseDate,
  type SchemaCascaderOption,
} from '@/utils/formSchema'
import type { FormSchema, FormSchemaField, FormSchemaEnumOptions } from '@/composables'
import type { FormFieldItem } from '../base/FormFieldEditor'
import { findProcessDefinition, readGlobalForm } from '../base/globalForm'
import type { ExtraFieldTab } from '../base'

export const formTaskTabs: ExtraFieldTab[] = [
  { name: 'formTaskOperations', labelKey: 'bpmnPanel.tabs.formTaskOperations' },
]

export interface FormTaskOperationItem {
  _key: number
  fieldName: string
  op: 'add' | 'delete'
  value: string
  /** 值输入方式：true 用对应类型的控件，false 用文本输入框 */
  useControl: boolean
}

/** 输入参数命名约定：formk:<op>:<字段名>，供后端 formService 按前缀解析 */
const FORM_OPERATIONS_PREFIX = 'formk:'

let opKeySeq = 0

function createDefaultOperation(): FormTaskOperationItem {
  return { _key: opKeySeq++, fieldName: '', op: 'add', value: '', useControl: true }
}

function findInputOutput(extensionElements: any): any {
  if (!extensionElements?.values) return null
  return extensionElements.values.find((v: any) => v.$type === 'camunda:InputOutput') || null
}

function parseParamName(
  name: string,
): { op: FormTaskOperationItem['op']; fieldName: string } | null {
  if (!name.startsWith(FORM_OPERATIONS_PREFIX)) return null
  const parts = name.split(':')
  const op = parts[1]
  if (op !== 'add' && op !== 'delete') return null
  return { op, fieldName: parts.slice(2).join(':') }
}

function buildParamName(op: string, fieldName: string): string {
  return `${FORM_OPERATIONS_PREFIX}${op}:${fieldName}`
}

function typeLabelKey(type: string): string {
  switch (type) {
    case 'string':
      return 'bpmnPanel.options.fieldTypeString'
    case 'long':
      return 'bpmnPanel.options.fieldTypeLong'
    case 'boolean':
      return 'bpmnPanel.options.fieldTypeBoolean'
    case 'date':
      return 'bpmnPanel.options.fieldTypeDate'
    case 'enum':
      return 'bpmnPanel.options.fieldTypeEnum'
    case 'double':
      return 'bpmnPanel.formTask.typeDouble'
    case 'object':
      return 'bpmnPanel.formTask.typeObject'
    case 'array':
      return 'bpmnPanel.formTask.typeArray'
    default:
      return ''
  }
}

/** 把全局表单的生成字段映射为 schema 字段 */
function mapGlobalFormField(f: FormFieldItem): FormSchemaField {
  return {
    name: f.id,
    label: f.label || f.id,
    type: f.type,
    datePattern: f.datePattern || undefined,
    enumValues: f.enumValues.filter((ev) => ev.id).map((ev) => ({ id: ev.id, name: ev.name })),
  }
}

interface EnumOption extends SelectOption {
  label: string
  value: string
  disabled?: boolean
}

/** 解析枚举 options：enumValues / 字符串数组 / {label,value} 数组 / 动态字典（按 code 查询） */
function resolveStaticEnumOptions(
  field: FormSchemaField | null,
  options: FormSchemaEnumOptions | undefined,
): EnumOption[] | null {
  const evs = field?.enumValues || []
  if (evs.length) {
    return evs.map((ev) => ({ label: ev.name || ev.id, value: ev.id }))
  }
  if (Array.isArray(options)) {
    return options.map((o) =>
      typeof o === 'string'
        ? { label: o, value: o }
        : { label: o.label ?? String(o.value), value: String(o.value), disabled: o.disabled },
    )
  }
  return null
}

function getDynamicCode(options: FormSchemaEnumOptions | undefined): string {
  if (options && typeof options === 'object' && !Array.isArray(options) && options.dynamic) {
    return options.code || ''
  }
  return ''
}

/** 按字段类型渲染值输入框；manual 为 true 时固定为文本输入框 */
const FormTaskValueInput = defineComponent({
  name: 'FormTaskValueInput',
  props: {
    value: { type: String, default: '' },
    field: { type: Object as PropType<FormSchemaField | null>, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    placeholder: { type: String, default: '' },
    manual: { type: Boolean, default: false },
  },
  emits: ['update:value'],
  setup(props, { emit }) {
    const { t } = useCamundaI18n()
    const { lookups } = useCamundaLookups()
    const fieldType = computed(() => props.field?.type || 'string')
    const datePattern = computed(() => props.field?.datePattern || 'yyyy-MM-dd')
    const jsonError = ref(false)
    const jsonText = ref(props.value)

    const dynamicCode = computed(() => getDynamicCode(props.field?.options))
    const staticOptions = computed<EnumOption[] | null>(() =>
      resolveStaticEnumOptions(props.field, props.field?.options),
    )
    const dynamicItems = ref<EnumOption[]>([])
    const dynamicLoading = ref(false)

    watch(
      dynamicCode,
      async (code) => {
        dynamicItems.value = []
        if (!code || !lookups.searchDictItems) return
        dynamicLoading.value = true
        try {
          const items = await lookups.searchDictItems(code)
          dynamicItems.value = (items || []) as EnumOption[]
        } catch {
          dynamicItems.value = []
        } finally {
          dynamicLoading.value = false
        }
      },
      { immediate: true },
    )

    const enumOptions = computed<EnumOption[]>(() => {
      if (staticOptions.value) return staticOptions.value
      return dynamicItems.value
    })

    watch(
      () => props.value,
      (v) => {
        if (v !== jsonText.value) {
          jsonText.value = v ?? ''
          jsonError.value = false
        }
      },
    )

    function emitValue(v: string) {
      emit('update:value', v)
    }

    function onJsonUpdate(v: string | null) {
      jsonText.value = v ?? ''
      jsonError.value = false
      emitValue(v ?? '')
    }

    function onJsonBlur() {
      const raw = jsonText.value.trim()
      if (!raw) {
        jsonError.value = false
        return
      }
      try {
        JSON.parse(raw)
        jsonError.value = false
      } catch {
        jsonError.value = true
      }
    }

    return () => {
      if (props.manual) {
        return (
          <NInput
            value={props.value}
            onUpdateValue={(v: string | null) => emitValue(v ?? '')}
            placeholder={props.placeholder}
            size={props.formSize}
            style="width:100%"
          />
        )
      }

      const type = fieldType.value

      if (type === 'long' || type === 'double') {
        return (
          <NInputNumber
            value={props.value === '' ? null : Number(props.value)}
            onUpdateValue={(v: number | null) => emitValue(v !== null ? String(v) : '')}
            size={props.formSize}
            style="width:100%"
            placeholder={props.placeholder}
          />
        )
      }

      if (type === 'boolean') {
        return (
          <NSwitch
            value={props.value === 'true'}
            onUpdateValue={(v: boolean) => emitValue(v ? 'true' : 'false')}
            size={props.formSize === 'small' ? 'small' : 'medium'}
          />
        )
      }

      if (type === 'date') {
        return (
          <NDatePicker
            value={parseDate(props.value, datePattern.value)}
            onUpdateValue={(v: number | null) => emitValue(formatDate(v, datePattern.value))}
            type={getDatePickerType(datePattern.value)}
            format={datePattern.value}
            size={props.formSize}
            style="width:100%"
            clearable
          />
        )
      }

      if (type === 'enum') {
        const noDictSource = !!dynamicCode.value && !lookups.searchDictItems
        return (
          <NSelect
            value={props.value || null}
            onUpdateValue={(v: string | null) => emitValue(v ?? '')}
            options={enumOptions.value}
            size={props.formSize}
            style="width:100%"
            placeholder={noDictSource ? t('bpmnPanel.formTask.noDictSource') : props.placeholder}
            clearable
            loading={dynamicLoading.value}
            disabled={noDictSource}
          />
        )
      }

      if (type === 'object' || type === 'array') {
        return (
          <div style="flex:1; min-width:0">
            <NInput
              type="textarea"
              value={jsonText.value}
              onUpdateValue={onJsonUpdate}
              onBlur={onJsonBlur}
              placeholder={t('bpmnPanel.formTask.jsonPlaceholder')}
              size={props.formSize}
              status={jsonError.value ? 'error' : undefined}
              style="width:100%"
            />
            {jsonError.value && (
              <div class="text-12px text-red-500 mt-2px">{t('bpmnPanel.formTask.jsonInvalid')}</div>
            )}
          </div>
        )
      }

      return (
        <NInput
          value={props.value}
          onUpdateValue={(v: string | null) => emitValue(v ?? '')}
          placeholder={props.placeholder}
          size={props.formSize}
          style="width:100%"
        />
      )
    }
  },
})

export default defineComponent({
  name: 'FormTaskExtraFields',
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
    tabName: { type: String, default: 'formTaskOperations' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const { getModdle, getOrCreateExtensionElements, updateProperties } = useBpmnProperties(props)
    const { schema } = useFormSchema()
    const operations = ref<FormTaskOperationItem[]>([])
    const opOptions = [
      { label: t('bpmnPanel.formTask.opAdd'), value: 'add' },
      { label: t('bpmnPanel.formTask.opDelete'), value: 'delete' },
    ]

    const hasSchema = computed(() => (effectiveSchema.value || []).length > 0)
    const cascaderOptions = computed<SchemaCascaderOption[]>(() =>
      buildCascaderOptions(effectiveSchema.value, {
        wholeLabel: t('bpmnPanel.formTask.whole'),
      }),
    )

    /**
     * 生效的字段结构：
     * - 优先使用 onLoadFormSchema 加载的 schema（主要面向 camunda 表单）
     * - 未加载时，若全局表单为「生成表单」，直接读取其字段作为 schema
     */
    const effectiveSchema = computed<FormSchema>(() => {
      const loaded = schema.value || []
      if (loaded.length > 0) return loaded
      const processBo = findProcessDefinition(props.businessObject)
      if (!processBo) return []
      const gf = readGlobalForm(processBo)
      if (gf.type !== 'generated') return []
      return gf.fields.filter((f) => f.id).map(mapGlobalFormField)
    })

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) {
        operations.value = []
        return
      }
      const ee = bo.extensionElements
      const io = findInputOutput(ee)
      const raw: any[] = io ? io.inputParameters || [] : []
      operations.value = raw
        .map((p: any) => {
          const parsed = parseParamName(p.name || '')
          if (!parsed) return null
          return {
            _key: opKeySeq++,
            fieldName: parsed.fieldName,
            op: parsed.op,
            value: p.value ?? '',
            useControl: true,
          }
        })
        .filter((item: any): item is FormTaskOperationItem => item !== null)
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function save(list: FormTaskOperationItem[]) {
      const moddle = getModdle()
      const ee = getOrCreateExtensionElements()
      if (!moddle || !ee) return

      let io = findInputOutput(ee)
      if (!io) {
        io = moddle.create('camunda:InputOutput')
        ee.values.push(io)
      }

      const current = io.inputParameters || []
      const others = current.filter((p: any) => !parseParamName(p.name || ''))

      const params = list
        .filter((item) => item.fieldName)
        .map((item) =>
          moddle.create('camunda:InputParameter', {
            name: buildParamName(item.op, item.fieldName),
            ...(item.value ? { value: item.value } : {}),
          }),
        )

      io.inputParameters = [...others, ...params]
      updateProperties({ extensionElements: ee })
    }

    function add() {
      const next = [...operations.value, createDefaultOperation()]
      operations.value = next
      save(next)
    }

    function remove(index: number) {
      const next = operations.value.filter((_, i) => i !== index)
      operations.value = next
      save(next)
    }

    function update(index: number, field: keyof FormTaskOperationItem, val: any) {
      const next = operations.value.map((item, i) =>
        i === index ? { ...item, [field]: val } : item,
      )
      operations.value = next
      save(next)
    }

    function toggleControl(index: number, useControl: boolean) {
      const next = operations.value.map((item, i) => (i === index ? { ...item, useControl } : item))
      operations.value = next
    }

    return () => {
      if (props.tabName !== 'formTaskOperations') return null

      const items = operations.value
      const showCascader = hasSchema.value

      return (
        <div>
          <div class="text-12px font-bold mb-8px">{t('bpmnPanel.formTask.title')}</div>
          {showCascader && (
            <div class="mb-8px text-12px text-#888">{t('bpmnPanel.formTask.schemaHint')}</div>
          )}
          {items.length === 0 ? (
            <div class="flex flex-col items-center gap-8px py-12px">
              <NEmpty description={t('bpmnPanel.panel.noFields')} size="small" />
              <NButton size="tiny" onClick={add} class="w-full justify-center">
                {t('bpmnPanel.formTask.addOperation')}
              </NButton>
            </div>
          ) : (
            <div class="flex flex-col gap-6px">
              {items.map((item, index) => {
                const field = resolveFieldByPath(effectiveSchema.value, item.fieldName)
                const typeLabel = typeLabelKey(field?.type || 'string')
                const manual = item.useControl === false
                const isJsonLayout =
                  !!field && !manual && (field.type === 'object' || field.type === 'array')
                const showToggle = showCascader && !!field
                const fieldRequired = !item.fieldName
                const valueInput = (
                  <FormTaskValueInput
                    value={item.value}
                    field={field}
                    formSize={props.formSize}
                    manual={manual}
                    placeholder={t('bpmnPanel.formTask.placeholderValue')}
                    onUpdate:value={(v: string) => update(index, 'value', v)}
                  />
                )
                const toggle = (
                  <div class="flex items-center gap-2px shrink-0">
                    <NButton
                      size="tiny"
                      type={!manual ? 'primary' : 'default'}
                      quaternary={manual}
                      onClick={() => toggleControl(index, true)}
                    >
                      {t('bpmnPanel.formTask.controlMode')}
                    </NButton>
                    <NButton
                      size="tiny"
                      type={manual ? 'primary' : 'default'}
                      quaternary={!manual}
                      onClick={() => toggleControl(index, false)}
                    >
                      {t('bpmnPanel.formTask.textMode')}
                    </NButton>
                  </div>
                )
                return (
                  <div class="flex flex-col gap-4px p-6px border border-solid border-light_border dark:border-dark_border rounded-4px">
                    <div class="flex gap-4px items-center">
                      {showCascader ? (
                        <NCascader
                          value={storedPathToCascaderValue(effectiveSchema.value, item.fieldName)}
                          onUpdateValue={(v: string | number | null) =>
                            update(index, 'fieldName', cascaderValueToStoredPath(v))
                          }
                          options={cascaderOptions.value}
                          placeholder={t('bpmnPanel.formTask.placeholderFieldName')}
                          size={props.formSize}
                          style="flex:1; min-width:0"
                          clearable
                          status={fieldRequired ? 'error' : undefined}
                        />
                      ) : (
                        <NInput
                          value={item.fieldName}
                          onUpdateValue={(v: string | null) => update(index, 'fieldName', v ?? '')}
                          placeholder={t('bpmnPanel.formTask.placeholderFieldName')}
                          size={props.formSize}
                          style="flex:1"
                          status={fieldRequired ? 'error' : undefined}
                        />
                      )}
                      <NSelect
                        value={item.op}
                        onUpdateValue={(v: string | null) => update(index, 'op', v ?? 'add')}
                        options={opOptions}
                        size={props.formSize}
                        style="width:90px"
                      />
                      <NButton text type="error" size="tiny" onClick={() => remove(index)}>
                        {t('bpmnPanel.buttons.delete')}
                      </NButton>
                    </div>
                    {fieldRequired && (
                      <div class="text-12px text-red-500">
                        {t('bpmnPanel.formTask.fieldNameRequired')}
                      </div>
                    )}
                    {isJsonLayout ? (
                      <div class="flex flex-col gap-4px">
                        {valueInput}
                        <div class="flex items-center justify-between gap-8px">
                          {typeLabel ? (
                            <span class="text-12px text-#888 whitespace-nowrap">
                              {t('bpmnPanel.formTask.fieldType')}: {t(typeLabel)}
                            </span>
                          ) : (
                            <span />
                          )}
                          {showToggle && toggle}
                        </div>
                      </div>
                    ) : (
                      <div class="flex gap-4px items-center">
                        <div style="flex:1; min-width:0">{valueInput}</div>
                        {typeLabel && (
                          <span class="text-12px text-#888 whitespace-nowrap">
                            {t('bpmnPanel.formTask.fieldType')}: {t(typeLabel)}
                          </span>
                        )}
                        {showToggle && toggle}
                      </div>
                    )}
                  </div>
                )
              })}
              <NButton size="tiny" onClick={add} class="w-full justify-center">
                {t('bpmnPanel.formTask.addOperation')}
              </NButton>
            </div>
          )}
        </div>
      )
    }
  },
})
