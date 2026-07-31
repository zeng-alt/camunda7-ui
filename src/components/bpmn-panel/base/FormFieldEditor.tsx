import { defineComponent, computed, type PropType } from 'vue'
import {
  NButton,
  NInput,
  NSelect,
  NCheckbox,
  NInputNumber,
  NSwitch,
  NDatePicker,
  NEmpty,
  type SelectOption,
} from 'naive-ui'
import { useCamundaI18n } from '../../../locales'

export interface ConstraintState {
  required: boolean
  readOnly: boolean
  minLength: number | null
  maxLength: number | null
  min: number | null
  max: number | null
  validator: string
}

export interface PropEntry {
  _key: number
  name: string
  value: string
}

export interface EnumEntry {
  _key: number
  id: string
  name: string
}

export interface FormFieldItem {
  _key: number
  id: string
  label: string
  type: 'string' | 'long' | 'boolean' | 'date' | 'enum'
  defaultValue: string
  datePattern: string
  constraints: ConstraintState
  properties: PropEntry[]
  enumValues: EnumEntry[]
}

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

export function createFormField(): FormFieldItem {
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
    required: false,
    readOnly: false,
    minLength: null,
    maxLength: null,
    min: null,
    max: null,
    validator: '',
  }
  if (!validation?.constraints) return c
  const list: any[] = Array.isArray(validation.constraints) ? validation.constraints : []
  for (const ct of list) {
    switch (ct.name) {
      case 'required':
        c.required = true
        break
      case 'readonly':
        c.readOnly = true
        break
      case 'minlength':
        c.minLength = Number(ct.config) || null
        break
      case 'maxlength':
        c.maxLength = Number(ct.config) || null
        break
      case 'min':
        c.min = Number(ct.config) || null
        break
      case 'max':
        c.max = Number(ct.config) || null
        break
      case 'validator':
        c.validator = ct.config || ''
        break
    }
  }
  return c
}

export function readFormField(f: any): FormFieldItem {
  const rawProps: any[] = f.properties?.values
    ? Array.isArray(f.properties.values)
      ? f.properties.values
      : []
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
      _key: keySeq++,
      name: p.name || '',
      value: p.value || '',
    })),
    enumValues: valsArr.map((v: any) => ({
      _key: keySeq++,
      id: v.id || '',
      name: v.name || '',
    })),
  }
}

export default defineComponent({
  name: 'FormFieldEditor',
  props: {
    // 表单字段列表（受控）
    items: { type: Array as PropType<FormFieldItem[]>, default: () => [] },
    // 表单控件尺寸：small / medium / large
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
  },
  emits: ['update:items'],
  setup(props, { emit }) {
    const { t } = useCamundaI18n()

    const fieldTypeOptions = computed<SelectOption[]>(() => [
      { label: t('bpmnPanel.options.fieldTypeString'), value: 'string' },
      { label: t('bpmnPanel.options.fieldTypeLong'), value: 'long' },
      { label: t('bpmnPanel.options.fieldTypeBoolean'), value: 'boolean' },
      { label: t('bpmnPanel.options.fieldTypeDate'), value: 'date' },
      { label: t('bpmnPanel.options.fieldTypeEnum'), value: 'enum' },
    ])

    const dateFormatOptions = computed<SelectOption[]>(() =>
      dateFormatKeys.map((d) => ({ label: t(d.labelKey), value: d.value })),
    )

    function emitChange(next: FormFieldItem[]) {
      emit('update:items', next)
    }

    function addField() {
      emitChange([...props.items, createFormField()])
    }

    function removeField(index: number) {
      emitChange(props.items.filter((_, i) => i !== index))
    }

    function updateFieldItem(index: number, field: string, val: any) {
      emitChange(props.items.map((item, i) => (i === index ? { ...item, [field]: val } : item)))
    }

    function updateConstraint(index: number, field: keyof ConstraintState, val: any) {
      emitChange(
        props.items.map((item, i) =>
          i === index ? { ...item, constraints: { ...item.constraints, [field]: val } } : item,
        ),
      )
    }

    function addProp(fieldIndex: number) {
      emitChange(
        props.items.map((item, i) =>
          i === fieldIndex
            ? { ...item, properties: [...item.properties, { _key: keySeq++, name: '', value: '' }] }
            : item,
        ),
      )
    }

    function removeProp(fieldIndex: number, propIndex: number) {
      emitChange(
        props.items.map((item, i) =>
          i === fieldIndex
            ? { ...item, properties: item.properties.filter((_, pi) => pi !== propIndex) }
            : item,
        ),
      )
    }

    function updateProp(
      fieldIndex: number,
      propIndex: number,
      field: 'name' | 'value',
      val: string,
    ) {
      emitChange(
        props.items.map((item, i) =>
          i === fieldIndex
            ? {
                ...item,
                properties: item.properties.map((p, pi) =>
                  pi === propIndex ? { ...p, [field]: val } : p,
                ),
              }
            : item,
        ),
      )
    }

    function addEnumValue(fieldIndex: number) {
      emitChange(
        props.items.map((item, i) =>
          i === fieldIndex
            ? { ...item, enumValues: [...item.enumValues, { _key: keySeq++, id: '', name: '' }] }
            : item,
        ),
      )
    }

    function removeEnumValue(fieldIndex: number, enumIndex: number) {
      emitChange(
        props.items.map((item, i) =>
          i === fieldIndex
            ? { ...item, enumValues: item.enumValues.filter((_, ei) => ei !== enumIndex) }
            : item,
        ),
      )
    }

    function updateEnumValue(
      fieldIndex: number,
      enumIndex: number,
      field: 'id' | 'name',
      val: string,
    ) {
      emitChange(
        props.items.map((item, i) =>
          i === fieldIndex
            ? {
                ...item,
                enumValues: item.enumValues.map((ev, ei) =>
                  ei === enumIndex ? { ...ev, [field]: val } : ev,
                ),
              }
            : item,
        ),
      )
    }

    return () => (
      <div class="mt-12px">
        <div class="flex flex-col gap-8px">
          {props.items.length === 0 ? (
            <div class="flex flex-col items-center gap-12px py-24px">
              <NEmpty description={t('bpmnPanel.panel.noFields')} size="small" />
              <NButton size="tiny" onClick={addField} class="w-full justify-center">
                {t('bpmnPanel.buttons.addFormField')}
              </NButton>
            </div>
          ) : (
            props.items.map((item, index) => (
              <div class="flex flex-col gap-6px p-10px border border-solid border-light_border dark:border-dark_border rounded-4px bg-#fafafa dark:bg-#1a1a1a">
                <div class="flex justify-between items-center">
                  <span class="text-12px font-bold">{item.id || 'Field ' + (index + 1)}</span>
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
                  <div class="mb-4px text-12px text-#888">
                    {t('bpmnPanel.fields.formFieldLabel')}
                  </div>
                  <NInput
                    value={item.label}
                    onUpdateValue={(v: string | null) => updateFieldItem(index, 'label', v ?? '')}
                    placeholder={t('bpmnPanel.placeholders.formFieldLabel')}
                    size={props.formSize}
                  />
                </div>
                <div>
                  <div class="mb-4px text-12px text-#888">
                    {t('bpmnPanel.fields.formFieldType')}
                  </div>
                  <NSelect
                    value={item.type}
                    onUpdateValue={(v: string | null) =>
                      updateFieldItem(index, 'type', v ?? 'string')
                    }
                    options={fieldTypeOptions.value}
                    size={props.formSize}
                  />
                </div>
                <div class="flex gap-8px items-end">
                  <div style="flex:1">
                    <div class="mb-4px text-12px text-#888">
                      {t('bpmnPanel.fields.formFieldDefault')}
                    </div>
                    {item.type === 'long' ? (
                      <NInputNumber
                        value={item.defaultValue ? Number(item.defaultValue) : null}
                        onUpdateValue={(v: number | null) =>
                          updateFieldItem(index, 'defaultValue', v !== null ? String(v) : '')
                        }
                        size={props.formSize}
                        style="width:100%"
                      />
                    ) : item.type === 'boolean' ? (
                      <NSwitch
                        value={item.defaultValue === 'true'}
                        onUpdateValue={(v: boolean) =>
                          updateFieldItem(index, 'defaultValue', v ? 'true' : 'false')
                        }
                      />
                    ) : item.type === 'date' ? (
                      <NDatePicker
                        value={toTimestamp(item.defaultValue)}
                        onUpdateValue={(v: number | null) =>
                          updateFieldItem(index, 'defaultValue', v !== null ? String(v) : '')
                        }
                        type={getDatePickerType(item.datePattern)}
                        format={item.datePattern || 'yyyy-MM-dd'}
                        size={props.formSize}
                        style="width:100%"
                      />
                    ) : item.type === 'enum' ? (
                      <NSelect
                        value={item.defaultValue || null}
                        onUpdateValue={(v: string | null) =>
                          updateFieldItem(index, 'defaultValue', v ?? '')
                        }
                        options={item.enumValues
                          .filter((ev) => ev.id)
                          .map((ev) => ({ label: ev.name || ev.id, value: ev.id }))}
                        placeholder={t('bpmnPanel.placeholders.formFieldDefault')}
                        size={props.formSize}
                        clearable
                      />
                    ) : (
                      <NInput
                        value={item.defaultValue}
                        onUpdateValue={(v: string | null) =>
                          updateFieldItem(index, 'defaultValue', v ?? '')
                        }
                        placeholder={t('bpmnPanel.placeholders.formFieldDefault')}
                        size={props.formSize}
                      />
                    )}
                  </div>
                  {item.type === 'date' && (
                    <div style="width:160px">
                      <div class="mb-4px text-12px text-#888">
                        {t('bpmnPanel.fields.formFieldDatePattern')}
                      </div>
                      <NSelect
                        value={item.datePattern || null}
                        onUpdateValue={(v: string | null) =>
                          updateFieldItem(index, 'datePattern', v ?? '')
                        }
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
                        <NButton
                          size="tiny"
                          onClick={() => addEnumValue(index)}
                          class="w-full justify-center"
                        >
                          {t('bpmnPanel.buttons.addEnumValue')}
                        </NButton>
                      </div>
                    ) : (
                      <div class="flex flex-col gap-4px">
                        {item.enumValues.map((ev, ei) => (
                          <div class="flex gap-4px items-end">
                            <div style="flex:1">
                              <div class="mb-2px text-12px text-#888">
                                {t('bpmnPanel.fields.formFieldId')}
                              </div>
                              <NInput
                                value={ev.id}
                                onUpdateValue={(v: string | null) =>
                                  updateEnumValue(index, ei, 'id', v ?? '')
                                }
                                placeholder={t('bpmnPanel.placeholders.formFieldId')}
                                size={props.formSize}
                              />
                            </div>
                            <div style="flex:2">
                              <div class="mb-2px text-12px text-#888">
                                {t('bpmnPanel.fields.formFieldLabel')}
                              </div>
                              <NInput
                                value={ev.name}
                                onUpdateValue={(v: string | null) =>
                                  updateEnumValue(index, ei, 'name', v ?? '')
                                }
                                placeholder={t('bpmnPanel.placeholders.formFieldLabel')}
                                size={props.formSize}
                              />
                            </div>
                            <NButton
                              text
                              type="error"
                              size="tiny"
                              onClick={() => removeEnumValue(index, ei)}
                            >
                              {t('bpmnPanel.buttons.delete')}
                            </NButton>
                          </div>
                        ))}
                        <NButton
                          size="tiny"
                          onClick={() => addEnumValue(index)}
                          class="w-full justify-center"
                        >
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
                      v-show={item.type !== 'boolean'}
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
                              <span class="text-12px text-#888 whitespace-nowrap">
                                {t('bpmnPanel.fields.constraintMinLength')}:
                              </span>
                              <NInputNumber
                                value={item.constraints.minLength}
                                onUpdateValue={(v: number | null) =>
                                  updateConstraint(index, 'minLength', v)
                                }
                                size={props.formSize}
                                min={0}
                                style="width:100%"
                              />
                            </div>
                            <div class="flex items-center gap-4px" style="flex:1">
                              <span class="text-12px text-#888 whitespace-nowrap">
                                {t('bpmnPanel.fields.constraintMaxLength')}:
                              </span>
                              <NInputNumber
                                value={item.constraints.maxLength}
                                onUpdateValue={(v: number | null) =>
                                  updateConstraint(index, 'maxLength', v)
                                }
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
                              <span class="text-12px text-#888 whitespace-nowrap">
                                {t('bpmnPanel.fields.constraintMin')}:
                              </span>
                              {ft === 'date' ? (
                                <NDatePicker
                                  value={toTimestamp(
                                    item.constraints.min !== null
                                      ? String(item.constraints.min)
                                      : '',
                                  )}
                                  onUpdateValue={(v: number | null) =>
                                    updateConstraint(index, 'min', v !== null ? v : null)
                                  }
                                  type={getDatePickerType(item.datePattern)}
                                  format={item.datePattern || 'yyyy-MM-dd'}
                                  size={props.formSize}
                                  style="width:100%"
                                  clearable
                                />
                              ) : (
                                <NInputNumber
                                  value={item.constraints.min}
                                  onUpdateValue={(v: number | null) =>
                                    updateConstraint(index, 'min', v)
                                  }
                                  size={props.formSize}
                                  style="width:100%"
                                />
                              )}
                            </div>
                            <div class="flex items-center gap-4px" style="flex:1">
                              <span class="text-12px text-#888 whitespace-nowrap">
                                {t('bpmnPanel.fields.constraintMax')}:
                              </span>
                              {ft === 'date' ? (
                                <NDatePicker
                                  value={toTimestamp(
                                    item.constraints.max !== null
                                      ? String(item.constraints.max)
                                      : '',
                                  )}
                                  onUpdateValue={(v: number | null) =>
                                    updateConstraint(index, 'max', v !== null ? v : null)
                                  }
                                  type={getDatePickerType(item.datePattern)}
                                  format={item.datePattern || 'yyyy-MM-dd'}
                                  size={props.formSize}
                                  style="width:100%"
                                  clearable
                                />
                              ) : (
                                <NInputNumber
                                  value={item.constraints.max}
                                  onUpdateValue={(v: number | null) =>
                                    updateConstraint(index, 'max', v)
                                  }
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
                    <span class="text-12px text-#888">
                      {t('bpmnPanel.fields.constraintValidator')}:
                    </span>
                    <NInput
                      value={item.constraints.validator}
                      onUpdateValue={(v: string | null) =>
                        updateConstraint(index, 'validator', v ?? '')
                      }
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
                      <NButton
                        size="tiny"
                        onClick={() => addProp(index)}
                        class="w-full justify-center"
                      >
                        {t('bpmnPanel.buttons.addProperty')}
                      </NButton>
                    </div>
                  ) : (
                    <div class="flex flex-col gap-4px">
                      {item.properties.map((prop, pi) => (
                        <div class="flex gap-4px items-center">
                          <NInput
                            value={prop.name}
                            onUpdateValue={(v: string | null) =>
                              updateProp(index, pi, 'name', v ?? '')
                            }
                            placeholder={t('bpmnPanel.placeholders.propertyName')}
                            size={props.formSize}
                            style="flex:1"
                          />
                          <NInput
                            value={prop.value}
                            onUpdateValue={(v: string | null) =>
                              updateProp(index, pi, 'value', v ?? '')
                            }
                            placeholder={t('bpmnPanel.placeholders.propertyValue')}
                            size={props.formSize}
                            style="flex:1"
                          />
                          <NButton
                            text
                            type="error"
                            size="tiny"
                            onClick={() => removeProp(index, pi)}
                          >
                            {t('bpmnPanel.buttons.delete')}
                          </NButton>
                        </div>
                      ))}
                      <NButton
                        size="tiny"
                        onClick={() => addProp(index)}
                        class="w-full justify-center"
                      >
                        {t('bpmnPanel.buttons.addProperty')}
                      </NButton>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        {props.items.length > 0 && (
          <div class="mt-8px">
            <NButton size="tiny" onClick={addField} class="w-full justify-center">
              {t('bpmnPanel.buttons.addFormField')}
            </NButton>
          </div>
        )}
      </div>
    )
  },
})
