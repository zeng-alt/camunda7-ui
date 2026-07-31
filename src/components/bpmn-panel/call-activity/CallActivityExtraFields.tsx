import { defineComponent, ref, watch, computed, type PropType } from 'vue'
import { NInput, NSelect, NCheckbox } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useBpmnProperties, useFormSize } from '../../../composables'
import ExpressionField from '../base/ExpressionField'
import JavaClassField from '../base/JavaClassField'
import DelegateExpressionField from '../base/DelegateExpressionField'
import ProcessListPicker from '../base/ProcessListPicker'
import type { ExtraFieldTab } from '../base'
import type { ProcessLookupItem } from '../../../composables'

export const callActivityTabs: ExtraFieldTab[] = [
  { name: 'callActivity', labelKey: 'bpmnPanel.tabs.callActivity' },
]

const typeOptions = [
  { label: 'None', value: '' },
  { label: 'BPMN', value: 'bpmn' },
  { label: 'CMMN', value: 'cmmn' },
]

const bindingOptions = [
  { label: 'latest', value: 'latest' },
  { label: 'deployment', value: 'deployment' },
  { label: 'version', value: 'version' },
]

const delegateMappingTypeOptions = [
  { label: 'None', value: 'none' },
  { label: 'Class', value: 'class' },
  { label: 'Delegate Expression', value: 'delegateExpression' },
]

export default defineComponent({
  name: 'CallActivityExtraFields',
  props: {
    // 当前元素的 BPMN 业务对象（BusinessObject），用于读写模型属性
    businessObject: {
      type: Object as PropType<any>,
      default: null,
    },
    // 当前选中的 BPMN 图形元素
    element: {
      type: Object as PropType<any>,
      default: null,
    },
    // bpmn-js 模型器实例，用于执行建模命令、读写模型
    bpmnModeler: {
      type: Object,
      default: null,
    },
    // 表单控件尺寸：small / medium / large
    formSize: {
      type: String as PropType<'small' | 'medium' | 'large'>,
      default: 'small',
    },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const { labelClass } = useFormSize(() => props.formSize)
    const { getModdle, getOrCreateExtensionElements, updateProperty, updateProperties } =
      useBpmnProperties(props)
    const currentType = ref<'none' | 'bpmn' | 'cmmn'>('none')
    const calledElement = ref('')
    const caseRef = ref('')
    const calledElementBinding = ref('latest')
    const calledElementVersion = ref('')
    const selectedProcess = ref<ProcessLookupItem | null>(null)

    const versionOptions = computed(() =>
      (selectedProcess.value?.version || []).map((v) => ({ label: v, value: v })),
    )
    const calledElementTenantId = ref('')
    const businessKey = ref(false)
    const businessKeyExpression = ref('#{execution.processBusinessKey}')
    const delegateMappingType = ref<'none' | 'class' | 'delegateExpression'>('none')
    const variableMappingClass = ref('')
    const variableMappingDelegateExpression = ref('')

    function findBusinessKeyInEl(): any {
      const bo = props.businessObject
      if (!bo) return null
      const extValues = bo.extensionElements?.values || []
      return (
        extValues.find((v: any) => v.$type === 'camunda:In' && v.businessKey !== undefined) || null
      )
    }

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) return
      calledElement.value = bo.calledElement !== undefined ? bo.calledElement : ''
      caseRef.value = bo.caseRef !== undefined ? bo.caseRef : ''
      if (bo.calledElement !== undefined) {
        currentType.value = 'bpmn'
      } else if (bo.caseRef !== undefined) {
        currentType.value = 'cmmn'
      } else {
        currentType.value = 'none'
      }
      calledElementBinding.value = bo.calledElementBinding || 'latest'
      calledElementVersion.value = bo.calledElementVersion || ''
      calledElementTenantId.value = bo.calledElementTenantId || ''

      const bkEl = findBusinessKeyInEl()
      if (bkEl) {
        businessKey.value = true
        businessKeyExpression.value = bkEl.businessKey
      } else {
        businessKey.value = false
      }

      if (bo.variableMappingClass) {
        delegateMappingType.value = 'class'
        variableMappingClass.value = bo.variableMappingClass
      } else if (bo.variableMappingDelegateExpression) {
        delegateMappingType.value = 'delegateExpression'
        variableMappingDelegateExpression.value = bo.variableMappingDelegateExpression
      } else {
        delegateMappingType.value = 'none'
        variableMappingClass.value = ''
        variableMappingDelegateExpression.value = ''
      }
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function onCalledElementChange(val: string | null) {
      calledElement.value = val ?? ''
      updateProperty('calledElement', calledElement.value)
    }

    function onProcessItemChange(item: ProcessLookupItem | null) {
      selectedProcess.value = item
      if (item && calledElementBinding.value === 'version') {
        const versions = item.version || []
        if (versions.length > 0 && !versions.includes(calledElementVersion.value)) {
          calledElementVersion.value = versions[0] || ''
          updateProperty('calledElementVersion', calledElementVersion.value)
        }
      }
    }

    function onCaseRefChange(val: string | null) {
      caseRef.value = val ?? ''
      updateProperty('caseRef', caseRef.value)
    }

    function onTypeChange(val: string) {
      const newType = val as 'none' | 'bpmn' | 'cmmn'
      currentType.value = newType
      if (newType === 'none') {
        calledElement.value = ''
        caseRef.value = ''
        updateProperty('calledElement', undefined)
        updateProperty('caseRef', undefined)
      } else if (newType === 'bpmn') {
        caseRef.value = ''
        updateProperty('caseRef', undefined)
        calledElement.value = calledElement.value || ''
        updateProperty('calledElement', calledElement.value)
      } else if (newType === 'cmmn') {
        calledElement.value = ''
        updateProperty('calledElement', undefined)
        caseRef.value = caseRef.value || ''
        updateProperty('caseRef', caseRef.value)
      }
    }

    function onBindingChange(val: string) {
      calledElementBinding.value = val
      updateProperty('calledElementBinding', val)
      if (val !== 'version') {
        calledElementVersion.value = ''
        updateProperty('calledElementVersion', undefined)
      }
    }

    function onVersionChange(val: string | null) {
      calledElementVersion.value = val ?? ''
      updateProperty('calledElementVersion', calledElementVersion.value)
    }

    function onTenantIdChange(val: string | null) {
      calledElementTenantId.value = val ?? ''
      updateProperty('calledElementTenantId', calledElementTenantId.value)
    }

    function saveBusinessKey() {
      const moddle = getModdle()
      const ee = getOrCreateExtensionElements()
      if (!moddle || !ee) return

      const others = ee.values.filter(
        (v: any) => !(v.$type === 'camunda:In' && v.businessKey !== undefined),
      )

      if (businessKey.value) {
        others.push(
          moddle.create('camunda:In', {
            businessKey: businessKeyExpression.value,
          }),
        )
      }

      ee.values = others
      updateProperties({ extensionElements: ee })
    }

    function onBusinessKeyChange(val: boolean) {
      businessKey.value = val
      if (val) {
        businessKeyExpression.value = '#{execution.processBusinessKey}'
      }
      saveBusinessKey()
    }

    function onBusinessKeyExpressionChange(val: string) {
      businessKeyExpression.value = val
      saveBusinessKey()
    }

    function onDelegateMappingTypeChange(val: string | null) {
      const newType = (val ?? 'none') as 'none' | 'class' | 'delegateExpression'
      delegateMappingType.value = newType

      const attrs: Record<string, any> = {
        variableMappingClass: undefined,
        variableMappingDelegateExpression: undefined,
      }

      if (newType === 'class') {
        attrs.variableMappingClass = variableMappingClass.value || undefined
      } else if (newType === 'delegateExpression') {
        attrs.variableMappingDelegateExpression =
          variableMappingDelegateExpression.value || undefined
      }

      updateProperties(attrs)
    }

    function onDelegateMappingClassChange(val: string) {
      variableMappingClass.value = val
      if (delegateMappingType.value === 'class') {
        updateProperty('variableMappingClass', val)
      }
    }

    function onDelegateMappingExpressionChange(val: string) {
      variableMappingDelegateExpression.value = val
      if (delegateMappingType.value === 'delegateExpression') {
        updateProperty('variableMappingDelegateExpression', val)
      }
    }

    return () => (
      <div class="flex flex-col gap-12px pt-8px">
        <div class="text-12px font-bold text-#333 dark:text-#ccc">
          {t('bpmnPanel.fields.calledElement')}
        </div>
        <div>
          <div class={`mb-4px ${labelClass}`}>{t('bpmnPanel.fields.calledElementType')}</div>
          <NSelect
            value={currentType.value}
            onUpdateValue={onTypeChange}
            options={typeOptions}
            size={props.formSize}
          />
        </div>
        {currentType.value === 'bpmn' && (
          <div>
            <div class={`mb-4px ${labelClass}`}>{t('bpmnPanel.fields.calledElement')}</div>
            <ProcessListPicker
              value={calledElement.value}
              onUpdate:value={onCalledElementChange}
              onUpdate:item={onProcessItemChange}
              formSize={props.formSize}
            />
          </div>
        )}
        {currentType.value === 'cmmn' && (
          <div>
            <div class={`mb-4px ${labelClass}`}>{t('bpmnPanel.fields.caseRef')}</div>
            <NInput
              value={caseRef.value}
              onUpdateValue={onCaseRefChange}
              placeholder={t('bpmnPanel.placeholders.caseRef')}
              size={props.formSize}
            />
          </div>
        )}
        {currentType.value !== 'none' && (
          <>
            <div>
              <div class={`mb-4px ${labelClass}`}>{t('bpmnPanel.fields.calledElementBinding')}</div>
              <NSelect
                value={calledElementBinding.value}
                onUpdateValue={onBindingChange}
                options={bindingOptions}
                size={props.formSize}
              />
            </div>
            {calledElementBinding.value === 'version' && (
              <div>
                <div class={`mb-4px ${labelClass}`}>
                  {t('bpmnPanel.fields.calledElementVersion')}
                </div>
                {versionOptions.value.length > 0 ? (
                  <NSelect
                    value={calledElementVersion.value || null}
                    onUpdateValue={onVersionChange}
                    options={versionOptions.value}
                    placeholder={t('bpmnPanel.placeholders.calledElementVersion')}
                    size={props.formSize}
                    clearable
                  />
                ) : (
                  <NInput
                    value={calledElementVersion.value}
                    onUpdateValue={onVersionChange}
                    placeholder={t('bpmnPanel.placeholders.calledElementVersion')}
                    size={props.formSize}
                  />
                )}
              </div>
            )}
            <div>
              <div class={`mb-4px ${labelClass}`}>
                {t('bpmnPanel.fields.calledElementTenantId')}
              </div>
              <NInput
                value={calledElementTenantId.value}
                onUpdateValue={onTenantIdChange}
                placeholder={t('bpmnPanel.placeholders.calledElementTenantId')}
                size={props.formSize}
              />
            </div>
          </>
        )}
        <div class="border-t border-solid border-light_border dark:border-dark_border my-4px" />
        <div>
          <NCheckbox
            checked={businessKey.value}
            onUpdateChecked={onBusinessKeyChange}
            size={props.formSize === 'small' ? 'small' : 'medium'}
          >
            {t('bpmnPanel.fields.calledElementBusinessKey')}
          </NCheckbox>
        </div>
        {businessKey.value && (
          <div>
            <div class={`mb-4px ${labelClass}`}>
              {t('bpmnPanel.fields.calledElementBusinessKeyExpression')}
            </div>
            <ExpressionField
              value={businessKeyExpression.value}
              onUpdateValue={onBusinessKeyExpressionChange}
              formSize={props.formSize}
            />
          </div>
        )}
        {currentType.value === 'bpmn' && (
          <>
            <div class="border-t border-solid border-light_border dark:border-dark_border my-4px" />
            <div>
              <div class={`mb-4px ${labelClass}`}>
                {t('bpmnPanel.fields.delegateVariableMapping')}
              </div>
              <NSelect
                value={delegateMappingType.value}
                onUpdateValue={onDelegateMappingTypeChange}
                options={delegateMappingTypeOptions}
                size={props.formSize}
              />
            </div>
            {delegateMappingType.value === 'class' && (
              <div>
                <div class={`mb-4px ${labelClass}`}>
                  {t('bpmnPanel.fields.variableMappingClass')}
                </div>
                <JavaClassField
                  value={variableMappingClass.value}
                  onUpdateValue={onDelegateMappingClassChange}
                  formSize={props.formSize}
                />
              </div>
            )}
            {delegateMappingType.value === 'delegateExpression' && (
              <div>
                <div class={`mb-4px ${labelClass}`}>
                  {t('bpmnPanel.fields.variableMappingDelegateExpression')}
                </div>
                <DelegateExpressionField
                  value={variableMappingDelegateExpression.value}
                  onUpdateValue={onDelegateMappingExpressionChange}
                  formSize={props.formSize}
                />
              </div>
            )}
          </>
        )}
      </div>
    )
  },
})
