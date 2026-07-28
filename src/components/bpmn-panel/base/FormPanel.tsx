import { defineComponent, ref, watch, toRaw, computed, type PropType } from 'vue'
import { NButton, NInput, NSelect, NCheckbox, NInputNumber, NSwitch, NDatePicker, NEmpty, NModal, type SelectOption } from 'naive-ui'
import FormPreview from './FormPreview'
import type { PreviewField } from './FormPreview'
import { useCamundaI18n } from '../../../locales'
import type { ExtraFieldTab } from './index'

type FormType = 'none' | 'camunda' | 'external' | 'generated'
type FieldTypeVal = 'string' | 'long' | 'boolean' | 'date' | 'enum'

interface ConstraintState {
  required: boolean
  readOnly: boolean
  minLength: number | null
  maxLength: number | null
  min: number | null
  max: number | null
  validator: string
}

interface PropEntry {
  _key: number
  name: string
  value: string
}

interface EnumEntry {
  _key: number
  id: string
  name: string
}

interface FormFieldItem {
  _key: number
  id: string
  label: string
  type: FieldTypeVal
  defaultValue: string
  datePattern: string
  constraints: ConstraintState
  properties: PropEntry[]
  enumValues: EnumEntry[]
}

export const formTabs: ExtraFieldTab[] = [
  { name: 'forms', labelKey: 'bpmnPanel.tabs.forms' },
]

const dateFormatKeys: { labelKey: string; value: string }[] = [
  { labelKey: 'bpmnPanel.options.dateFormatYmd', value: 'yyyy-MM-dd' },
  { labelKey: 'bpmnPanel.options.dateFormatYmdHms', value: 'yyyy-MM-dd HH:mm:ss' },
  { labelKey: 'bpmnPanel.options.dateFormatYm', value: 'yyyy-MM' },
  { labelKey: 'bpmnPanel.options.dateFormatY', value: 'yyyy' },
]

function getDatePickerType(pattern: string): 'date' | 'datetime' | 'month' | 'year' {
  if (pattern.includes('HH')) return 'datetime'
  if (pattern === 'yyyy-MM') return 'month'
  if (pattern === 'yyyy') return 'year'
  return 'date'
}

function toTimestamp(value: string): number | null {
  if (!value) return null
  const n = Number(value)
  if (!isNaN(n)) return n
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d.getTime()
}

let keySeq = 0

function createField(): FormFieldItem {
  return {
    _key: keySeq++,
    id: '',
    label: '',
    type: 'string',
    defaultValue: '',
    datePattern: '',
    constraints: {
      required: false,
      readOnly: false,
      minLength: null,
      maxLength: null,
      min: null,
      max: null,
      validator: '',
    },
    properties: [],
    enumValues: [],
  }
}

function readConstraints(validation: any): ConstraintState {
  const c: ConstraintState = {
    required: false, readOnly: false, minLength: null,
    maxLength: null, min: null, max: null, validator: '',
  }
  if (!validation?.constraints) return c
  const list: any[] = Array.isArray(validation.constraints) ? validation.constraints : []
  for (const ct of list) {
    switch (ct.name) {
      case 'required': c.required = true; break
      case 'readonly': c.readOnly = true; break
      case 'minlength': c.minLength = Number(ct.config) || null; break
      case 'maxlength': c.maxLength = Number(ct.config) || null; break
      case 'min': c.min = Number(ct.config) || null; break
      case 'max': c.max = Number(ct.config) || null; break
      case 'validator': c.validator = ct.config || ''; break
    }
  }
  return c
}

function readField(f: any): FormFieldItem {
  const rawProps: any[] = f.properties?.values
    ? (Array.isArray(f.properties.values) ? f.properties.values : [])
    : []
  const dateProp = rawProps.find((p: any) => p.name === 'datePattern')
  const propsArr = rawProps.filter((p: any) => p.name !== 'datePattern')
  const valsArr: any[] = Array.isArray(f.values) ? f.values : []
  return {
    _key: keySeq++,
    id: f.id || '',
    label: f.label || '',
    type: f.type || 'string',
    defaultValue: f.defaultValue || '',
    datePattern: dateProp?.value || f.datePattern || '',
    constraints: readConstraints(f.validation),
    properties: propsArr.map((p: any) => ({
      _key: keySeq++, name: p.name || '', value: p.value || '',
    })),
    enumValues: valsArr.map((v: any) => ({
      _key: keySeq++, id: v.id || '', name: v.name || '',
    })),
  }
}

export default defineComponent({
  name: 'FormPanel',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
  },
  setup(props) {
    const { t } = useCamundaI18n()

    const formType = ref<FormType>('external')
    const formKey = ref('')
    const formRef = ref('')
    const formRefBinding = ref('deployment')
    const items = ref<FormFieldItem[]>([])

    const showPreview = ref(false)

    const fieldTypeOptions = computed<SelectOption[]>(() => [
      { label: t('bpmnPanel.options.fieldTypeString'), value: 'string' },
      { label: t('bpmnPanel.options.fieldTypeLong'), value: 'long' },
      { label: t('bpmnPanel.options.fieldTypeBoolean'), value: 'boolean' },
      { label: t('bpmnPanel.options.fieldTypeDate'), value: 'date' },
      { label: t('bpmnPanel.options.fieldTypeEnum'), value: 'enum' },
    ])

    const bindingOptions = computed<SelectOption[]>(() => [
      { label: t('bpmnPanel.options.bindingDeployment'), value: 'deployment' },
      { label: t('bpmnPanel.options.bindingLatest'), value: 'latest' },
      { label: t('bpmnPanel.options.bindingVersion'), value: 'version' },
    ])

    const dateFormatOptions = computed<SelectOption[]>(() =>
      dateFormatKeys.map((d) => ({ label: t(d.labelKey), value: d.value })),
    )

    const previewFields = computed<PreviewField[]>(() =>
      items.value.filter(f => f.id).map(f => ({
        id: f.id,
        label: f.label,
        type: f.type,
        defaultValue: f.defaultValue,
        datePattern: f.datePattern,
        required: f.constraints.required,
        readOnly: f.constraints.readOnly,
        minLength: f.constraints.minLength,
        maxLength: f.constraints.maxLength,
        min: f.constraints.min,
        max: f.constraints.max,
        validator: f.constraints.validator,
        enumValues: f.enumValues.filter(ev => ev.id).map(ev => ({ id: ev.id, name: ev.name })),
        properties: f.properties.filter(p => p.name).reduce<Record<string, string>>((acc, p) => {
          acc[p.name] = p.value
          return acc
        }, {}),
      })),
    )

    function detectFormType(): FormType {
      const bo = props.businessObject
      if (!bo) return 'none'
      if (bo.formRef) return 'camunda'
      if (bo.formKey) {
        if (bo.formKey.startsWith('camunda-forms:')) return 'camunda'
        return 'external'
      }
      const ext = bo.extensionElements
      if (ext?.values?.some((v: any) => v.$type === 'camunda:FormData')) return 'generated'
      return 'none'
    }

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) return

      formType.value = detectFormType()
      formKey.value = bo.formKey || ''
      formRef.value = bo.formRef || ''
      formRefBinding.value = bo.formRefBinding || 'deployment'

      const ext = bo.extensionElements
      const formData = ext?.values?.find((v: any) => v.$type === 'camunda:FormData')
      if (formData) {
        const raw: any[] = Array.isArray(formData.fields) ? formData.fields : []
        items.value = raw.map(readField)
      } else {
        items.value = []
      }
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function save() {
      if (!props.bpmnModeler || !props.element) return
      const moddle = props.bpmnModeler.get('moddle')
      const modeling = props.bpmnModeler.get('modeling')
      const bo = props.businessObject
      if (!bo) return

      const type = formType.value
      const updates: Record<string, any> = {}

      if (type === 'camunda') {
        updates.formRef = formRef.value || null
        updates.formRefBinding = formRefBinding.value || 'deployment'
        updates.formKey = formKey.value || null
      } else if (type === 'external') {
        updates.formKey = formKey.value || null
        updates.formRef = null
        updates.formRefBinding = null
      } else {
        updates.formKey = null
        updates.formRef = null
        updates.formRefBinding = null
      }

      if (!bo.extensionElements && type === 'generated') {
        bo.extensionElements = moddle.create('bpmn:ExtensionElements', { values: [] })
      }

      const extValues = bo.extensionElements?.get('values') || []
      const others = extValues.filter((v: any) => v.$type !== 'camunda:FormData')

      if (type === 'generated') {
        const validFields = items.value.filter((f) => f.id)
        if (validFields.length > 0) {
          const formData = moddle.create('camunda:FormData')
          formData.fields = validFields.map((item) => {
            const attrs: Record<string, any> = {
              id: item.id,
              label: item.label,
              type: item.type,
            }
            if (item.defaultValue) attrs.defaultValue = item.defaultValue
            const constraints: any[] = []
            if (item.constraints.required) constraints.push(moddle.create('camunda:Constraint', { name: 'required' }))
            if (item.constraints.readOnly) constraints.push(moddle.create('camunda:Constraint', { name: 'readonly' }))
            if (item.constraints.minLength !== null) constraints.push(moddle.create('camunda:Constraint', { name: 'minlength', config: String(item.constraints.minLength) }))
            if (item.constraints.maxLength !== null) constraints.push(moddle.create('camunda:Constraint', { name: 'maxlength', config: String(item.constraints.maxLength) }))
            if (item.constraints.min !== null) constraints.push(moddle.create('camunda:Constraint', { name: 'min', config: String(item.constraints.min) }))
            if (item.constraints.max !== null) constraints.push(moddle.create('camunda:Constraint', { name: 'max', config: String(item.constraints.max) }))
            if (item.constraints.validator) constraints.push(moddle.create('camunda:Constraint', { name: 'validator', config: item.constraints.validator }))

            if (constraints.length > 0) {
              attrs.validation = moddle.create('camunda:Validation', { constraints })
            }

            const propEntries: { name: string; value: string }[] = item.properties.filter((p) => p.name)
            if (item.type === 'date' && item.datePattern) {
              propEntries.push({ name: 'datePattern', value: item.datePattern })
            }
            if (propEntries.length > 0) {
              attrs.properties = moddle.create('camunda:Properties', {
                values: propEntries.map((p) => moddle.create('camunda:Property', { name: p.name, value: p.value })),
              })
            }

            const validValues = item.enumValues.filter((v) => v.id)
            if (validValues.length > 0) {
              attrs.values = validValues.map((v) => moddle.create('camunda:Value', { id: v.id, name: v.name }))
            }

            return moddle.create('camunda:FormField', attrs)
          })
          others.push(formData)
        }
        bo.extensionElements.values = others
        updates.extensionElements = bo.extensionElements
      } else if (others.length !== extValues.length) {
        bo.extensionElements.values = others
        updates.extensionElements = bo.extensionElements
      }

      modeling.updateProperties(toRaw(props.element), updates)
    }

    function onFormTypeChange(val: FormType) {
      formType.value = val
      save()
    }

    function onFormKeyChange(val: string | null) {
      formKey.value = val ?? ''
      save()
    }

    function onFormRefChange(val: string | null) {
      formRef.value = val ?? ''
      save()
    }

    function onFormRefBindingChange(val: string | null) {
      formRefBinding.value = val ?? 'deployment'
      save()
    }

    function openPreview() {
      showPreview.value = true
    }

    function addField() {
      const next = [...items.value, createField()]
      items.value = next
      save()
    }

    function removeField(index: number) {
      const next = items.value.filter((_, i) => i !== index)
      items.value = next
      save()
    }

    function updateFieldItem(index: number, field: string, val: any) {
      const next = items.value.map((item, i) =>
        i === index ? { ...item, [field]: val } : item,
      )
      items.value = next
      save()
    }

    function updateConstraint(index: number, field: keyof ConstraintState, val: any) {
      const next = items.value.map((item, i) =>
        i === index
          ? { ...item, constraints: { ...item.constraints, [field]: val } }
          : item,
      )
      items.value = next
      save()
    }

    function addProp(fieldIndex: number) {
      const next = items.value.map((item, i) =>
        i === fieldIndex
          ? { ...item, properties: [...item.properties, { _key: keySeq++, name: '', value: '' }] }
          : item,
      )
      items.value = next
      save()
    }

    function removeProp(fieldIndex: number, propIndex: number) {
      const next = items.value.map((item, i) =>
        i === fieldIndex
          ? { ...item, properties: item.properties.filter((_, pi) => pi !== propIndex) }
          : item,
      )
      items.value = next
      save()
    }

    function updateProp(fieldIndex: number, propIndex: number, field: 'name' | 'value', val: string) {
      const next = items.value.map((item, i) =>
        i === fieldIndex
          ? {
              ...item,
              properties: item.properties.map((p, pi) =>
                pi === propIndex ? { ...p, [field]: val } : p,
              ),
            }
          : item,
      )
      items.value = next
      save()
    }

    function addEnumValue(fieldIndex: number) {
      const next = items.value.map((item, i) =>
        i === fieldIndex
          ? { ...item, enumValues: [...item.enumValues, { _key: keySeq++, id: '', name: '' }] }
          : item,
      )
      items.value = next
      save()
    }

    function removeEnumValue(fieldIndex: number, enumIndex: number) {
      const next = items.value.map((item, i) =>
        i === fieldIndex
          ? { ...item, enumValues: item.enumValues.filter((_, ei) => ei !== enumIndex) }
          : item,
      )
      items.value = next
      save()
    }

    function updateEnumValue(fieldIndex: number, enumIndex: number, field: 'id' | 'name', val: string) {
      const next = items.value.map((item, i) =>
        i === fieldIndex
          ? {
              ...item,
              enumValues: item.enumValues.map((ev, ei) =>
                ei === enumIndex ? { ...ev, [field]: val } : ev,
              ),
            }
          : item,
      )
      items.value = next
      save()
    }

    const renderFieldEditor = () => (
      <div class="mt-12px">
        <div class="flex flex-col gap-8px">
          {items.value.length === 0 ? (
            <div class="flex flex-col items-center gap-12px py-24px">
              <NEmpty description={t('bpmnPanel.panel.noFields')} size="small" />
              <NButton size="tiny" onClick={addField} class="w-full justify-center">
                {t('bpmnPanel.buttons.addFormField')}
              </NButton>
            </div>
          ) : (
            items.value.map((item, index) => (
              <div class="flex flex-col gap-6px p-10px border border-solid border-light_border dark:border-dark_border rounded-4px bg-#fafafa dark:bg-#1a1a1a">
                <div class="flex justify-between items-center">
                  <span class="text-12px font-bold">{item.id || ('Field ' + (index + 1))}</span>
                  <NButton text type="error" size="tiny" onClick={() => removeField(index)}>
                    {t('bpmnPanel.buttons.delete')}
                  </NButton>
                </div>
                <div>
                  <div class="mb-4px text-12px text-#888">{t('bpmnPanel.fields.formFieldId')}</div>
                  <NInput
                    value={item.id}
                    onUpdateValue={(v: string | null) => updateFieldItem(index, 'id', v ?? '')}
                    placeholder={t('bpmnPanel.placeholders.formFieldId')}
                    size={props.formSize}
                  />
                </div>
                <div>
                  <div class="mb-4px text-12px text-#888">{t('bpmnPanel.fields.formFieldLabel')}</div>
                  <NInput
                    value={item.label}
                    onUpdateValue={(v: string | null) => updateFieldItem(index, 'label', v ?? '')}
                    placeholder={t('bpmnPanel.placeholders.formFieldLabel')}
                    size={props.formSize}
                  />
                </div>
                <div>
                  <div class="mb-4px text-12px text-#888">{t('bpmnPanel.fields.formFieldType')}</div>
                  <NSelect
                    value={item.type}
                    onUpdateValue={(v: string | null) => updateFieldItem(index, 'type', v ?? 'string')}
                    options={fieldTypeOptions.value}
                    size={props.formSize}
                  />
                </div>
                <div class="flex gap-8px items-end">
                  <div style="flex:1">
                    <div class="mb-4px text-12px text-#888">{t('bpmnPanel.fields.formFieldDefault')}</div>
                    {item.type === 'long' ? (
                      <NInputNumber
                        value={item.defaultValue ? Number(item.defaultValue) : null}
                        onUpdateValue={(v: number | null) => updateFieldItem(index, 'defaultValue', v !== null ? String(v) : '')}
                        size={props.formSize}
                        style="width:100%"
                      />
                    ) : item.type === 'boolean' ? (
                      <NSwitch
                        value={item.defaultValue === 'true'}
                        onUpdateValue={(v: boolean) => updateFieldItem(index, 'defaultValue', v ? 'true' : 'false')}
                      />
                    ) : item.type === 'date' ? (
                      <NDatePicker
                        value={toTimestamp(item.defaultValue)}
                        onUpdateValue={(v: number | null) => updateFieldItem(index, 'defaultValue', v !== null ? String(v) : '')}
                        type={getDatePickerType(item.datePattern)}
                        format={item.datePattern || 'yyyy-MM-dd'}
                        size={props.formSize}
                        style="width:100%"
                      />
                    ) : item.type === 'enum' ? (
                      <NSelect
                        value={item.defaultValue || null}
                        onUpdateValue={(v: string | null) => updateFieldItem(index, 'defaultValue', v ?? '')}
                        options={item.enumValues.filter(ev => ev.id).map(ev => ({ label: ev.name || ev.id, value: ev.id }))}
                        placeholder={t('bpmnPanel.placeholders.formFieldDefault')}
                        size={props.formSize}
                        clearable
                      />
                    ) : (
                      <NInput
                        value={item.defaultValue}
                        onUpdateValue={(v: string | null) => updateFieldItem(index, 'defaultValue', v ?? '')}
                        placeholder={t('bpmnPanel.placeholders.formFieldDefault')}
                        size={props.formSize}
                      />
                    )}
                  </div>
                  {item.type === 'date' && (
                    <div style="width:160px">
                      <div class="mb-4px text-12px text-#888">{t('bpmnPanel.fields.formFieldDatePattern')}</div>
                      <NSelect
                        value={item.datePattern || null}
                        onUpdateValue={(v: string | null) => updateFieldItem(index, 'datePattern', v ?? '')}
                        options={dateFormatOptions.value}
                        size={props.formSize}
                        placeholder={t('bpmnPanel.placeholders.formFieldDatePattern')}
                        clearable
                      />
                    </div>
                  )}
                </div>

                {item.type === 'enum' && (
                  <div class="border-t border-dashed border-light_border dark:border-dark_border pt-6px mt-2px">
                    <div class="text-12px font-bold mb-4px">{t('bpmnPanel.fields.enumValues')}</div>
                    {item.enumValues.length === 0 ? (
                      <div class="flex flex-col items-center gap-8px py-8px">
                        <NEmpty description={t('bpmnPanel.panel.noFields')} size="small" />
                        <NButton size="tiny" onClick={() => addEnumValue(index)} class="w-full justify-center">
                          {t('bpmnPanel.buttons.addEnumValue')}
                        </NButton>
                      </div>
                    ) : (
                      <div class="flex flex-col gap-4px">
                        {item.enumValues.map((ev, ei) => (
                          <div class="flex gap-4px items-end">
                            <div style="flex:1">
                              <div class="mb-2px text-12px text-#888">{t('bpmnPanel.fields.formFieldId')}</div>
                              <NInput
                                value={ev.id}
                                onUpdateValue={(v: string | null) => updateEnumValue(index, ei, 'id', v ?? '')}
                                placeholder={t('bpmnPanel.placeholders.formFieldId')}
                                size={props.formSize}
                              />
                            </div>
                            <div style="flex:2">
                              <div class="mb-2px text-12px text-#888">{t('bpmnPanel.fields.formFieldLabel')}</div>
                              <NInput
                                value={ev.name}
                                onUpdateValue={(v: string | null) => updateEnumValue(index, ei, 'name', v ?? '')}
                                placeholder={t('bpmnPanel.placeholders.formFieldLabel')}
                                size={props.formSize}
                              />
                            </div>
                            <NButton text type="error" size="tiny" onClick={() => removeEnumValue(index, ei)}>
                              {t('bpmnPanel.buttons.delete')}
                            </NButton>
                          </div>
                        ))}
                        <NButton size="tiny" onClick={() => addEnumValue(index)} class="w-full justify-center">
                          {t('bpmnPanel.buttons.addEnumValue')}
                        </NButton>
                      </div>
                    )}
                  </div>
                )}

                <div class="border-t border-dashed border-light_border dark:border-dark_border pt-6px mt-2px">
                  <div class="text-12px font-bold mb-4px">{t('bpmnPanel.fields.constraints')}</div>
                  <div class="flex gap-12px items-center mb-4px">
                    <NCheckbox
                      checked={item.constraints.required}
                      onUpdateChecked={(v: boolean) => updateConstraint(index, 'required', v)}
                      size={props.formSize === 'small' ? 'small' : 'medium'}
                    >
                      {t('bpmnPanel.fields.constraintRequired')}
                    </NCheckbox>
                    <NCheckbox
                      checked={item.constraints.readOnly}
                      onUpdateChecked={(v: boolean) => updateConstraint(index, 'readOnly', v)}
                      size={props.formSize === 'small' ? 'small' : 'medium'}
                    >
                      {t('bpmnPanel.fields.constraintReadOnly')}
                    </NCheckbox>
                  </div>
                  {(() => {
                    const ft = item.type
                    return (
                      <>
                        {(ft === 'string' || ft === 'long') && (
                          <div class="flex gap-8px mb-4px">
                            <div class="flex items-center gap-4px" style="flex:1">
                              <span class="text-12px text-#888 whitespace-nowrap">{t('bpmnPanel.fields.constraintMinLength')}:</span>
                              <NInputNumber
                                value={item.constraints.minLength}
                                onUpdateValue={(v: number | null) => updateConstraint(index, 'minLength', v)}
                                size={props.formSize}
                                min={0}
                                style="width:100%"
                              />
                            </div>
                            <div class="flex items-center gap-4px" style="flex:1">
                              <span class="text-12px text-#888 whitespace-nowrap">{t('bpmnPanel.fields.constraintMaxLength')}:</span>
                              <NInputNumber
                                value={item.constraints.maxLength}
                                onUpdateValue={(v: number | null) => updateConstraint(index, 'maxLength', v)}
                                size={props.formSize}
                                min={0}
                                style="width:100%"
                              />
                            </div>
                          </div>
                        )}
                        {(ft === 'long' || ft === 'date') && (
                          <div class="flex gap-8px mb-4px">
                            <div class="flex items-center gap-4px" style="flex:1">
                              <span class="text-12px text-#888 whitespace-nowrap">{t('bpmnPanel.fields.constraintMin')}:</span>
                              {ft === 'date' ? (
                                <NDatePicker
                                  value={toTimestamp(item.constraints.min !== null ? String(item.constraints.min) : '')}
                                  onUpdateValue={(v: number | null) => updateConstraint(index, 'min', v !== null ? v : null)}
                                  type={getDatePickerType(item.datePattern)}
                                  format={item.datePattern || 'yyyy-MM-dd'}
                                  size={props.formSize}
                                  style="width:100%"
                                  clearable
                                />
                              ) : (
                                <NInputNumber
                                  value={item.constraints.min}
                                  onUpdateValue={(v: number | null) => updateConstraint(index, 'min', v)}
                                  size={props.formSize}
                                  style="width:100%"
                                />
                              )}
                            </div>
                            <div class="flex items-center gap-4px" style="flex:1">
                              <span class="text-12px text-#888 whitespace-nowrap">{t('bpmnPanel.fields.constraintMax')}:</span>
                              {ft === 'date' ? (
                                <NDatePicker
                                  value={toTimestamp(item.constraints.max !== null ? String(item.constraints.max) : '')}
                                  onUpdateValue={(v: number | null) => updateConstraint(index, 'max', v !== null ? v : null)}
                                  type={getDatePickerType(item.datePattern)}
                                  format={item.datePattern || 'yyyy-MM-dd'}
                                  size={props.formSize}
                                  style="width:100%"
                                  clearable
                                />
                              ) : (
                                <NInputNumber
                                  value={item.constraints.max}
                                  onUpdateValue={(v: number | null) => updateConstraint(index, 'max', v)}
                                  size={props.formSize}
                                  style="width:100%"
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )
                  })()}
                  <div class="flex items-center gap-4px">
                    <span class="text-12px text-#888">{t('bpmnPanel.fields.constraintValidator')}:</span>
                    <NInput
                      value={item.constraints.validator}
                      onUpdateValue={(v: string | null) => updateConstraint(index, 'validator', v ?? '')}
                      placeholder={t('bpmnPanel.placeholders.constraintValidator')}
                      size={props.formSize}
                      style="flex:1"
                    />
                  </div>
                </div>

                <div class="border-t border-dashed border-light_border dark:border-dark_border pt-6px mt-2px">
                  <div class="text-12px font-bold mb-4px">{t('bpmnPanel.fields.properties')}</div>
                  {item.properties.length === 0 ? (
                    <div class="flex flex-col items-center gap-8px py-8px">
                      <NButton size="tiny" onClick={() => addProp(index)} class="w-full justify-center">
                        {t('bpmnPanel.buttons.addProperty')}
                      </NButton>
                    </div>
                  ) : (
                    <div class="flex flex-col gap-4px">
                      {item.properties.map((prop, pi) => (
                        <div class="flex gap-4px items-center">
                          <NInput
                            value={prop.name}
                            onUpdateValue={(v: string | null) => updateProp(index, pi, 'name', v ?? '')}
                            placeholder={t('bpmnPanel.placeholders.propertyName')}
                            size={props.formSize}
                            style="flex:1"
                          />
                          <NInput
                            value={prop.value}
                            onUpdateValue={(v: string | null) => updateProp(index, pi, 'value', v ?? '')}
                            placeholder={t('bpmnPanel.placeholders.propertyValue')}
                            size={props.formSize}
                            style="flex:1"
                          />
                          <NButton text type="error" size="tiny" onClick={() => removeProp(index, pi)}>
                            {t('bpmnPanel.buttons.delete')}
                          </NButton>
                        </div>
                      ))}
                      <NButton size="tiny" onClick={() => addProp(index)} class="w-full justify-center">
                        {t('bpmnPanel.buttons.addProperty')}
                      </NButton>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        {items.value.length > 0 && (
          <div class="mt-8px">
            <NButton size="tiny" onClick={addField} class="w-full justify-center">
              {t('bpmnPanel.buttons.addFormField')}
            </NButton>
          </div>
        )}
      </div>
    )

    return () => {
      if (!props.businessObject) return null

      const type = formType.value

      return (
        <div>
          <div class="flex items-center gap-8px">
            <div style="flex:1">
              <div class="text-12px font-bold mb-8px">{t('bpmnPanel.fields.formType')}</div>
              <div class="flex flex-row"> 
                <NSelect
                  value={type}
                  onUpdateValue={onFormTypeChange}
                  options={[
                    { label: t('bpmnPanel.options.formTypeNone'), value: 'none' },
                    { label: t('bpmnPanel.options.formTypeCamunda'), value: 'camunda' },
                    { label: t('bpmnPanel.options.formTypeExternal'), value: 'external' },
                    { label: t('bpmnPanel.options.formTypeGenerated'), value: 'generated' },
                  ]}
                  size={props.formSize}
                />
                {type === 'generated' && items.value.length > 0 && (
                  <div class="ml-8">
                    <NButton size={props.formSize} type="primary" onClick={openPreview}>{t('bpmnPanel.buttons.preview')}</NButton>
                  </div>
                )}
              </div>
            </div>
            
          </div>

          {(type === 'camunda') && (
            <div>
              <div class="mt-8px">
                <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.formRef')}</div>
                <NInput
                  value={formRef.value}
                  onUpdateValue={onFormRefChange}
                  placeholder={t('bpmnPanel.placeholders.formRef')}
                  size={props.formSize}
                />
              </div>
              <div class="mt-8px">
                <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.formRefBinding')}</div>
                <NSelect
                  value={formRefBinding.value}
                  onUpdateValue={onFormRefBindingChange}
                  options={bindingOptions.value}
                  size={props.formSize}
                />
              </div>
            </div>
          )}

          {(type === 'camunda' || type === 'external') && (
            <div class="mt-8px">
              <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.formKey')}</div>
              <NInput
                value={formKey.value}
                onUpdateValue={onFormKeyChange}
                placeholder={t('bpmnPanel.placeholders.formKey')}
                size={props.formSize}
              />
            </div>
          )}

          {type === 'generated' && renderFieldEditor()}

          <NModal
            show={showPreview.value}
            onUpdateShow={(v: boolean) => { showPreview.value = v }}
            preset="card"
            title={t('bpmnPanel.buttons.preview')}
            style="width:1000px; max-width:95vw"
            size={props.formSize}
            segmented
          >
            <div class="flex gap-16px" style="max-height:65vh; min-height:400px">
              <div style="flex:1; min-width:0" class="overflow-y-auto camunda-props-scroll">
                <FormPreview
                  fields={previewFields.value}
                  showReset
                  showSubmit
                  size="small"
                  onSubmit={(data: Record<string, string>) => {
                    window.alert('Validation passed!')
                  }}
                  onReset={() => {}}
                />
              </div>
              <div style="flex:1; min-width:0" class="overflow-y-auto camunda-props-scroll">
                {renderFieldEditor()}
              </div>
            </div>
          </NModal>
        </div>
      )
    }
  },
})
