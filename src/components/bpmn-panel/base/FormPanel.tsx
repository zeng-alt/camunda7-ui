import { defineComponent, ref, computed, watch, toRaw, type PropType } from 'vue'
import { NButton, NInput, NSelect, NModal, type SelectOption } from 'naive-ui'
import FormPreview from './FormPreview'
import type { PreviewField } from './FormPreview'
import { useCamundaI18n } from '../../../locales'
import type { ExtraFieldTab } from './index'
import FormRefPicker from './FormRefPicker'
import FormKeyPicker from './FormKeyPicker'
import FormFieldEditor, { readFormField } from './FormFieldEditor'
import type { FormFieldItem } from './FormFieldEditor'
import type { ProcessLookupItem } from '@/composables'
import {
  findProcessDefinition,
  readGlobalForm,
  readUseGlobalForm,
  writeUseGlobalForm,
  type GlobalFormData,
} from './globalForm'

type FormType = 'none' | 'camunda' | 'external' | 'generated' | 'global'

export const formTabs: ExtraFieldTab[] = [{ name: 'forms', labelKey: 'bpmnPanel.tabs.forms' }]

export default defineComponent({
  name: 'FormPanel',
  props: {
    // 当前元素的 BPMN 业务对象（BusinessObject），用于读写模型属性
    businessObject: { type: Object as PropType<any>, default: null },
    // 当前选中的 BPMN 图形元素
    element: { type: Object as PropType<any>, default: null },
    // bpmn-js 模型器实例，用于执行建模命令、读写模型
    bpmnModeler: { type: Object, default: null },
    // 表单控件尺寸：small / medium / large
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    // 是否显示“全局表单”选项（由流程级别配置，所有用户任务共享）
    showGlobalOption: { type: Boolean, default: false },
  },
  setup(props) {
    const { t } = useCamundaI18n()

    const formType = ref<FormType>('external')
    const formKey = ref('')
    const formRef = ref('')
    const formRefBinding = ref('deployment')
    const formRefVersion = ref('')
    const selectedFormRef = ref<ProcessLookupItem | null>(null)
    const items = ref<FormFieldItem[]>([])
    const globalForm = ref<GlobalFormData | null>(null)

    const showPreview = ref(false)

    const bindingOptions = computed<SelectOption[]>(() => [
      { label: t('bpmnPanel.options.bindingDeployment'), value: 'deployment' },
      { label: t('bpmnPanel.options.bindingLatest'), value: 'latest' },
      { label: t('bpmnPanel.options.bindingVersion'), value: 'version' },
    ])

    const versionOptions = computed(() =>
      (selectedFormRef.value?.version || []).map((v) => ({ label: v, value: v })),
    )

    const previewFields = computed<PreviewField[]>(() =>
      items.value
        .filter((f) => f.id)
        .map((f) => ({
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
          enumValues: f.enumValues
            .filter((ev) => ev.id)
            .map((ev) => ({ id: ev.id, name: ev.name })),
          properties: f.properties
            .filter((p) => p.name)
            .reduce<Record<string, string>>((acc, p) => {
              acc[p.name] = p.value
              return acc
            }, {}),
        })),
    )

    function detectFormType(): FormType {
      const bo = props.businessObject
      if (!bo) return 'none'
      if (readUseGlobalForm(bo)) return 'global'
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
      formRefVersion.value = bo.formRefVersion || ''

      if (formType.value === 'global') {
        globalForm.value = readGlobalForm(findProcessDefinition(bo))
      } else {
        globalForm.value = null
      }

      const ext = bo.extensionElements
      const formData = ext?.values?.find((v: any) => v.$type === 'camunda:FormData')
      if (formData) {
        const raw: any[] = Array.isArray(formData.fields) ? formData.fields : []
        items.value = raw.map(readFormField)
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

      if (type === 'global') {
        updates.extensionElements = writeUseGlobalForm(bo, moddle, true) || bo.extensionElements
        updates.formKey = null
        updates.formRef = null
        updates.formRefBinding = null
        const extValues = bo.extensionElements?.get('values') || []
        const others = extValues.filter((v: any) => v.$type !== 'camunda:FormData')
        if (others.length !== extValues.length) {
          bo.extensionElements.values = others
          updates.extensionElements = bo.extensionElements
        }
      } else {
        if (readUseGlobalForm(bo)) {
          updates.extensionElements = writeUseGlobalForm(bo, moddle, false) || bo.extensionElements
        }
        if (type === 'camunda') {
          updates.formRef = formRef.value || null
          updates.formRefBinding = formRefBinding.value || 'deployment'
          updates.formRefVersion =
            formRefBinding.value === 'version' ? formRefVersion.value || null : undefined
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
              if (item.constraints.required)
                constraints.push(moddle.create('camunda:Constraint', { name: 'required' }))
              if (item.constraints.readOnly)
                constraints.push(moddle.create('camunda:Constraint', { name: 'readonly' }))
              if (item.constraints.minLength !== null)
                constraints.push(
                  moddle.create('camunda:Constraint', {
                    name: 'minlength',
                    config: String(item.constraints.minLength),
                  }),
                )
              if (item.constraints.maxLength !== null)
                constraints.push(
                  moddle.create('camunda:Constraint', {
                    name: 'maxlength',
                    config: String(item.constraints.maxLength),
                  }),
                )
              if (item.constraints.min !== null)
                constraints.push(
                  moddle.create('camunda:Constraint', {
                    name: 'min',
                    config: String(item.constraints.min),
                  }),
                )
              if (item.constraints.max !== null)
                constraints.push(
                  moddle.create('camunda:Constraint', {
                    name: 'max',
                    config: String(item.constraints.max),
                  }),
                )
              if (item.constraints.validator)
                constraints.push(
                  moddle.create('camunda:Constraint', {
                    name: 'validator',
                    config: item.constraints.validator,
                  }),
                )

              if (constraints.length > 0) {
                attrs.validation = moddle.create('camunda:Validation', { constraints })
              }

              const propEntries: { name: string; value: string }[] = item.properties.filter(
                (p) => p.name,
              )
              if (item.type === 'date' && item.datePattern) {
                propEntries.push({ name: 'datePattern', value: item.datePattern })
              }
              if (propEntries.length > 0) {
                attrs.properties = moddle.create('camunda:Properties', {
                  values: propEntries.map((p) =>
                    moddle.create('camunda:Property', { name: p.name, value: p.value }),
                  ),
                })
              }

              const validValues = item.enumValues.filter((v) => v.id)
              if (validValues.length > 0) {
                attrs.values = validValues.map((v) =>
                  moddle.create('camunda:Value', { id: v.id, name: v.name }),
                )
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
      }

      modeling.updateProperties(toRaw(props.element), updates)
    }

    function onFormTypeChange(val: FormType) {
      formType.value = val
      if (val === 'global') {
        globalForm.value = readGlobalForm(findProcessDefinition(props.businessObject))
      }
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

    function onFormRefItemChange(item: ProcessLookupItem | null) {
      selectedFormRef.value = item
      if (item && formRefBinding.value === 'version') {
        const versions = item.version || []
        if (versions.length > 0 && !versions.includes(formRefVersion.value)) {
          formRefVersion.value = versions[0] || ''
          save()
        }
      }
    }

    function onFormRefBindingChange(val: string | null) {
      formRefBinding.value = val ?? 'deployment'
      if (val !== 'version') {
        formRefVersion.value = ''
      }
      save()
    }

    function onFormRefVersionChange(val: string | null) {
      formRefVersion.value = val ?? ''
      save()
    }

    function onItemsChange(next: FormFieldItem[]) {
      items.value = next
      save()
    }

    function openPreview() {
      showPreview.value = true
    }

    function renderGlobalPreview() {
      const g = globalForm.value
      if (!g || g.type === 'none') {
        return (
          <div class="mt-8px text-12px text-#888">{t('bpmnPanel.globalForm.noGlobalForm')}</div>
        )
      }
      return (
        <div class="mt-8px">
          <div class="mb-4px text-12px text-#666">
            {t('bpmnPanel.fields.formType')}:{' '}
            <span class="text-#333 dark:text-#ddd">
              {t('bpmnPanel.options.formType' + g.type.charAt(0).toUpperCase() + g.type.slice(1))}
            </span>
          </div>
          {g.type === 'camunda' && g.formRef && (
            <div class="mb-4px text-12px text-#666">
              {t('bpmnPanel.fields.formRef')}:{' '}
              <span class="text-#333 dark:text-#ddd">{g.formRef}</span>
            </div>
          )}
          {g.type === 'external' && g.formKey && (
            <div class="mb-4px text-12px text-#666">
              {t('bpmnPanel.fields.formKey')}:{' '}
              <span class="text-#333 dark:text-#ddd">{g.formKey}</span>
            </div>
          )}
          {g.type === 'generated' && g.fields.length > 0 && (
            <div class="mt-8px flex flex-col gap-4px">
              {g.fields
                .filter((f) => f.id)
                .map((f) => (
                  <div class="flex items-center gap-8px p-6px border border-solid border-light_border dark:border-dark_border rounded-4px bg-#fafafa dark:bg-#1a1a1a">
                    <span class="text-12px font-bold flex-shrink-0">{f.id}</span>
                    <span class="text-12px text-#888 flex-1 truncate">{f.label}</span>
                    <span class="text-11px text-#999 flex-shrink-0">{f.type}</span>
                  </div>
                ))}
            </div>
          )}
          <div class="mt-8px text-11px text-#999">{t('bpmnPanel.globalForm.editHint')}</div>
        </div>
      )
    }

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
                  onUpdateValue={(v: string | null) => onFormTypeChange((v as FormType) || 'none')}
                  options={[
                    { label: t('bpmnPanel.options.formTypeNone'), value: 'none' },
                    { label: t('bpmnPanel.options.formTypeCamunda'), value: 'camunda' },
                    { label: t('bpmnPanel.options.formTypeExternal'), value: 'external' },
                    { label: t('bpmnPanel.options.formTypeGenerated'), value: 'generated' },
                    ...(props.showGlobalOption
                      ? [{ label: t('bpmnPanel.options.formTypeGlobal'), value: 'global' }]
                      : []),
                  ]}
                  size={props.formSize}
                />
                {type === 'generated' && items.value.length > 0 && (
                  <div class="ml-8">
                    <NButton size={props.formSize} type="primary" onClick={openPreview}>
                      {t('bpmnPanel.buttons.preview')}
                    </NButton>
                  </div>
                )}
              </div>
            </div>
          </div>

          {type === 'camunda' && (
            <div>
              <div class="mt-8px">
                <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.formRef')}</div>
                <FormRefPicker
                  value={formRef.value}
                  onUpdate:value={onFormRefChange}
                  onUpdate:item={onFormRefItemChange}
                  formSize={props.formSize}
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
              {formRefBinding.value === 'version' && (
                <div class="mt-8px">
                  <div class="mb-4px text-12px text-#666">
                    {t('bpmnPanel.fields.formRefVersion')}
                  </div>
                  {versionOptions.value.length > 0 ? (
                    <NSelect
                      value={formRefVersion.value || null}
                      onUpdateValue={onFormRefVersionChange}
                      options={versionOptions.value}
                      size={props.formSize}
                      clearable
                    />
                  ) : (
                    <NInput
                      value={formRefVersion.value}
                      onUpdateValue={onFormRefVersionChange}
                      placeholder="1.0"
                      size={props.formSize}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {type === 'external' && (
            <div class="mt-8px">
              <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.formKey')}</div>
              <FormKeyPicker
                value={formKey.value}
                onUpdate:value={onFormKeyChange}
                formSize={props.formSize}
              />
            </div>
          )}

          {type === 'global' && renderGlobalPreview()}

          {type === 'generated' && (
            <FormFieldEditor
              items={items.value}
              onUpdate:items={onItemsChange}
              formSize={props.formSize}
            />
          )}

          <NModal
            show={showPreview.value}
            onUpdateShow={(v: boolean) => {
              showPreview.value = v
            }}
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
                <FormFieldEditor
                  items={items.value}
                  onUpdate:items={onItemsChange}
                  formSize={props.formSize}
                />
              </div>
            </div>
          </NModal>
        </div>
      )
    }
  },
})
