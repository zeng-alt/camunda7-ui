import { defineComponent, ref, computed, watch, type PropType } from 'vue'
import { NButton, NInput, NSelect, NSwitch, NDatePicker, NInputNumber, NEmpty } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'

export interface PreviewField {
  id: string
  label?: string
  type: 'string' | 'long' | 'boolean' | 'date' | 'enum'
  defaultValue?: string
  datePattern?: string
  required?: boolean
  readOnly?: boolean
  minLength?: number | null
  maxLength?: number | null
  min?: number | null
  max?: number | null
  validator?: string
  enumValues?: { id: string; name: string }[]
  properties?: Record<string, string>
}

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

function typedProps(props: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [k, v] of Object.entries(props)) {
    if (v === 'true') result[k] = true
    else if (v === 'false') result[k] = false
    else {
      const n = Number(v)
      result[k] = !isNaN(n) && v.trim() !== '' ? n : v
    }
  }
  return result
}

export default defineComponent({
  name: 'FormPreview',
  props: {
    fields: { type: Array as PropType<PreviewField[]>, default: () => [] },
    showReset: { type: Boolean, default: true },
    showSubmit: { type: Boolean, default: true },
    submitLabel: { type: String, default: undefined },
    resetLabel: { type: String, default: undefined },
    size: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
  },
  emits: ['submit', 'reset'],
  setup(props, { emit }) {
    const { t } = useCamundaI18n()
    const formData = ref<Record<string, string>>({})
    const errors = ref<Record<string, string>>({})

    const validFields = computed(() => props.fields.filter((f) => f.id))

    const defaultsMap = computed(() => {
      const map: Record<string, string> = {}
      for (const f of validFields.value) {
        if (f.defaultValue) map[f.id] = f.defaultValue
      }
      return map
    })

    watch(
      validFields,
      () => {
        const map = defaultsMap.value
        formData.value = Object.keys(map).length > 0 ? { ...map } : {}
      },
      { immediate: true },
    )

    function validate(): boolean {
      const errs: Record<string, string> = {}
      for (const field of validFields.value) {
        if (field.readOnly) continue
        const val = formData.value[field.id] ?? ''
        if (field.required && !val) {
          errs[field.id] = field.label
            ? t('bpmnPanel.formPreview.required').replace('{label}', field.label)
            : t('bpmnPanel.formPreview.requiredNoLabel')
          continue
        }
        if (field.type === 'string') {
          if (field.minLength != null && val.length < field.minLength)
            errs[field.id] = t('bpmnPanel.formPreview.minLength').replace(
              '{min}',
              String(field.minLength),
            )
          if (field.maxLength != null && val.length > field.maxLength)
            errs[field.id] = t('bpmnPanel.formPreview.maxLength').replace(
              '{max}',
              String(field.maxLength),
            )
        }
        if (field.type === 'long' && val) {
          const num = Number(val)
          if (isNaN(num)) {
            errs[field.id] = t('bpmnPanel.formPreview.mustBeNumber')
          } else {
            if (field.min != null && num < field.min)
              errs[field.id] = t('bpmnPanel.formPreview.minValue').replace(
                '{min}',
                String(field.min),
              )
            if (field.max != null && num > field.max)
              errs[field.id] = t('bpmnPanel.formPreview.maxValue').replace(
                '{max}',
                String(field.max),
              )
          }
        }
        if (field.type === 'date' && val) {
          const ts = Number(val)
          if (!isNaN(ts)) {
            if (field.min != null && ts < field.min)
              errs[field.id] = t('bpmnPanel.formPreview.minDate').replace(
                '{date}',
                new Date(field.min).toLocaleDateString(),
              )
            if (field.max != null && ts > field.max)
              errs[field.id] = t('bpmnPanel.formPreview.maxDate').replace(
                '{date}',
                new Date(field.max).toLocaleDateString(),
              )
          }
        }
        if (field.validator && val) {
          try {
            const regex = new RegExp(field.validator)
            if (!regex.test(val))
              errs[field.id] = t('bpmnPanel.formPreview.regexMismatch').replace(
                '{pattern}',
                field.validator,
              )
          } catch {
            errs[field.id] = t('bpmnPanel.formPreview.regexInvalid')
          }
        }
      }
      errors.value = errs
      return Object.keys(errs).length === 0
    }

    function handleSubmit() {
      if (validate()) emit('submit', { ...formData.value })
    }

    function handleReset() {
      formData.value = { ...defaultsMap.value }
      errors.value = {}
      emit('reset')
    }

    const placeholderEnter = (field: PreviewField) =>
      t('bpmnPanel.formPreview.placeholderEnter').replace('{field}', field.label || field.id)
    const placeholderSelect = (field: PreviewField) =>
      t('bpmnPanel.formPreview.placeholderSelect').replace('{field}', field.label || field.id)

    return () => {
      if (validFields.value.length === 0) {
        return (
          <NEmpty
            class="h-full flex justify-center items-center"
            description={t('bpmnPanel.formPreview.noFields')}
            size={props.size}
          />
        )
      }

      return (
        <div class="flex flex-col gap-16px">
          {validFields.value.map((field) => {
            const err = errors.value[field.id]
            return (
              <div>
                <div class="flex items-center gap-4px mb-4px">
                  <span class="text-13px font-medium">{field.label || field.id}</span>
                  {field.required && <span class="text-red-500 text-12px">*</span>}
                </div>
                {(() => {
                  const p = typedProps(field.properties || {})
                  if (field.type === 'long') {
                    return (
                      <NInputNumber
                        {...p}
                        value={
                          formData.value[field.id] !== undefined
                            ? Number(formData.value[field.id])
                            : null
                        }
                        onUpdateValue={(v: number | null) => {
                          formData.value[field.id] = v !== null ? String(v) : ''
                        }}
                        placeholder={placeholderEnter(field)}
                        size={props.size}
                        style="width:100%"
                        status={err ? 'error' : undefined}
                        readonly={field.readOnly}
                      />
                    )
                  }
                  if (field.type === 'boolean') {
                    return (
                      <NSwitch
                        {...p}
                        value={formData.value[field.id] === 'true'}
                        onUpdateValue={(v: boolean) => {
                          formData.value[field.id] = v ? 'true' : 'false'
                        }}
                        disabled={field.readOnly}
                      />
                    )
                  }
                  if (field.type === 'date') {
                    return (
                      <NDatePicker
                        {...p}
                        value={toTimestamp(formData.value[field.id] ?? '')}
                        onUpdateValue={(v: number | null) => {
                          formData.value[field.id] = v !== null ? String(v) : ''
                        }}
                        type={getDatePickerType(field.datePattern || '')}
                        format={field.datePattern || 'yyyy-MM-dd'}
                        size={props.size}
                        style="width:100%"
                        status={err ? 'error' : undefined}
                        clearable
                        disabled={field.readOnly}
                      />
                    )
                  }
                  if (field.type === 'enum') {
                    return (
                      <NSelect
                        {...p}
                        value={formData.value[field.id] || null}
                        onUpdateValue={(v: string | null) => {
                          formData.value[field.id] = v ?? ''
                        }}
                        options={(field.enumValues || [])
                          .filter((ev) => ev.id)
                          .map((ev) => ({ label: ev.name || ev.id, value: ev.id }))}
                        placeholder={placeholderSelect(field)}
                        size={props.size}
                        status={err ? 'error' : undefined}
                        clearable
                        disabled={field.readOnly}
                      />
                    )
                  }
                  return (
                    <NInput
                      {...p}
                      value={formData.value[field.id] ?? ''}
                      onUpdateValue={(v: string | null) => {
                        formData.value[field.id] = v ?? ''
                      }}
                      placeholder={placeholderEnter(field)}
                      size={props.size}
                      status={err ? 'error' : undefined}
                      readonly={field.readOnly}
                    />
                  )
                })()}
                {err && <div class="text-red-500 text-11px mt-2px">{err}</div>}
              </div>
            )
          })}
          <div class="flex justify-end gap-8px">
            {props.showReset && (
              <NButton size={props.size} onClick={handleReset}>
                {props.resetLabel || t('bpmnPanel.formPreview.reset')}
              </NButton>
            )}
            {props.showSubmit && (
              <NButton size={props.size} type="primary" onClick={handleSubmit}>
                {props.submitLabel || t('bpmnPanel.formPreview.submit')}
              </NButton>
            )}
          </div>
        </div>
      )
    }
  },
})
