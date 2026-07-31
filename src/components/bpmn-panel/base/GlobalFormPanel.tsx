import { defineComponent, ref, watch, toRaw, computed, type PropType } from 'vue'
import { NButton, NInput, NSelect, NModal, type SelectOption } from 'naive-ui'
import FormPreview from './FormPreview'
import type { PreviewField } from './FormPreview'
import FormRefPicker from './FormRefPicker'
import FormKeyPicker from './FormKeyPicker'
import FormFieldEditor from './FormFieldEditor'
import type { FormFieldItem } from './FormFieldEditor'
import { useCamundaI18n } from '../../../locales'
import { useCamundaLookups, type ProcessLookupItem } from '@/composables'
import {
  readGlobalForm,
  writeGlobalForm,
  type GlobalFormData,
  type GlobalFormType,
} from './globalForm'

const typeOptions: { labelKey: string; value: GlobalFormType }[] = [
  { labelKey: 'bpmnPanel.options.formTypeNone', value: 'none' },
  { labelKey: 'bpmnPanel.options.formTypeCamunda', value: 'camunda' },
  { labelKey: 'bpmnPanel.options.formTypeExternal', value: 'external' },
  { labelKey: 'bpmnPanel.options.formTypeGenerated', value: 'generated' },
]

export default defineComponent({
  name: 'GlobalFormPanel',
  props: {
    // 流程业务对象（Process），用于读写全局表单扩展属性
    businessObject: { type: Object as PropType<any>, default: null },
    // 当前选中的 BPMN 图形元素
    element: { type: Object as PropType<any>, default: null },
    // bpmn-js 模型器实例，用于执行建模命令、读写模型
    bpmnModeler: { type: Object, default: null },
    // 表单控件尺寸：small / medium / large
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const { lookups } = useCamundaLookups()

    const formType = ref<GlobalFormType>('none')
    const formKey = ref('')
    const formRef = ref('')
    const formRefBinding = ref('deployment')
    const formRefVersion = ref('')
    const selectedFormRef = ref<ProcessLookupItem | null>(null)
    const items = ref<FormFieldItem[]>([])
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

    let formRefResolveSeq = 0
    async function resolveSelectedFormRef(value: string) {
      const seq = ++formRefResolveSeq
      if (!value || !lookups.searchFormRefs) {
        selectedFormRef.value = null
        return
      }
      try {
        const list = await lookups.searchFormRefs('')
        if (seq !== formRefResolveSeq) return
        selectedFormRef.value = list.find((p) => p.value === value) || null
      } catch {
        if (seq === formRefResolveSeq) selectedFormRef.value = null
      }
    }

    function syncFromModel() {
      const data = readGlobalForm(props.businessObject)
      formType.value = data.type
      formKey.value = data.formKey
      formRef.value = data.formRef
      formRefBinding.value = data.binding
      formRefVersion.value = data.version
      items.value = data.fields
      resolveSelectedFormRef(data.formRef)
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function collectData(): GlobalFormData {
      return {
        type: formType.value,
        formRef: formRef.value,
        binding: formRefBinding.value,
        version: formRefVersion.value,
        formKey: formKey.value,
        fields: items.value,
      }
    }

    function persist() {
      if (!props.bpmnModeler || !props.businessObject) return
      const moddle = props.bpmnModeler.get('moddle')
      const modeling = props.bpmnModeler.get('modeling')
      const bo = props.businessObject
      const { extensionElements } = writeGlobalForm(bo, moddle, collectData())
      let target = props.element
      if (target?.businessObject !== bo) {
        const root = props.bpmnModeler.get('canvas')?.getRootElement()
        if (root?.businessObject === bo) target = root
        else target = null
      }
      if (target) {
        modeling.updateProperties(toRaw(target), { extensionElements })
      } else {
        try {
          modeling.updateProperties({ businessObject: bo, id: bo.id }, { extensionElements })
        } catch {
          // 直接修改已写入模型，XML 导出时仍然会保留
        }
      }
    }

    function onFormTypeChange(val: GlobalFormType) {
      formType.value = val
      persist()
    }

    function onFormKeyChange(val: string | null) {
      formKey.value = val ?? ''
      persist()
    }

    function onFormRefChange(val: string | null) {
      formRef.value = val ?? ''
      persist()
    }

    function onFormRefItemChange(item: ProcessLookupItem | null) {
      selectedFormRef.value = item
      if (item && formRefBinding.value === 'version') {
        const versions = item.version || []
        if (versions.length > 0 && !versions.includes(formRefVersion.value)) {
          formRefVersion.value = versions[0] || ''
          persist()
        }
      }
    }

    function onFormRefBindingChange(val: string | null) {
      formRefBinding.value = val ?? 'deployment'
      if (val !== 'version') {
        formRefVersion.value = ''
      }
      persist()
    }

    function onFormRefVersionChange(val: string | null) {
      formRefVersion.value = val ?? ''
      persist()
    }

    function onItemsChange(next: FormFieldItem[]) {
      items.value = next
      persist()
    }

    return () => {
      if (!props.businessObject) return null

      const type = formType.value

      return (
        <div>
          <div class="mb-8px text-12px text-#888">{t('bpmnPanel.globalForm.hint')}</div>
          <div class="flex items-center gap-8px">
            <div style="flex:1">
              <div class="text-12px font-bold mb-8px">{t('bpmnPanel.fields.formType')}</div>
              <div class="flex flex-row">
                <NSelect
                  value={type}
                  onUpdateValue={(v: string | null) =>
                    onFormTypeChange((v as GlobalFormType) || 'none')
                  }
                  options={typeOptions.map((o) => ({ label: t(o.labelKey), value: o.value }))}
                  size={props.formSize}
                />
                {type === 'generated' && items.value.length > 0 && (
                  <div class="ml-8">
                    <NButton
                      size={props.formSize}
                      type="primary"
                      onClick={() => (showPreview.value = true)}
                    >
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
                  onUpdateValue={(v: string | null) => onFormRefBindingChange(v)}
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
