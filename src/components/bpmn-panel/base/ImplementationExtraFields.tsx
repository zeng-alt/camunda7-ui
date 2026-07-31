import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NSelect } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import type { ExtraFieldTab } from '.'
import {
  JavaClassField,
  ExpressionField,
  DelegateExpressionField,
  ExternalTaskFields,
  ConnectorFields,
  ErrorFields,
  DmnFields,
} from '.'

export const implementationTabs: ExtraFieldTab[] = [
  { name: 'implementation', labelKey: 'bpmnPanel.tabs.implementation' },
]

type ImplType =
  | 'none'
  | 'class'
  | 'expression'
  | 'delegateExpression'
  | 'external'
  | 'connector'
  | 'dmn'

export default defineComponent({
  name: 'ImplementationExtraFields',
  props: {
    // 当前元素的 BPMN 业务对象（BusinessObject），用于读写模型属性
    businessObject: { type: Object as PropType<any>, default: null },
    // 当前选中的 BPMN 图形元素
    element: { type: Object as PropType<any>, default: null },
    // bpmn-js 模型器实例，用于执行建模命令、读写模型
    bpmnModeler: { type: Object, default: null },
    // 表单控件尺寸：small / medium / large
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    // 是否显示外部任务错误定义配置
    showExternalErrors: { type: Boolean, default: false },
    // 默认实现类型（固定类型时不显示选择器）
    defaultType: { type: String as PropType<ImplType | null>, default: null },
    // 是否显示 DMN（业务规则任务）选项
    showDmn: { type: Boolean, default: false },
  },
  setup(props) {
    const { t } = useCamundaI18n()

    const implType = ref<ImplType>('none')

    function buildOptions() {
      const opts: { label: string; value: string }[] = [
        { label: t('bpmnPanel.fields.implNone'), value: 'none' },
        { label: t('bpmnPanel.fields.implExternal'), value: 'external' },
        { label: t('bpmnPanel.fields.implClass'), value: 'class' },
        { label: t('bpmnPanel.fields.implExpression'), value: 'expression' },
        { label: t('bpmnPanel.fields.implDelegateExpression'), value: 'delegateExpression' },
        { label: t('bpmnPanel.fields.implConnector'), value: 'connector' },
      ]
      if (props.showDmn) {
        opts.push({ label: t('bpmnPanel.fields.implDmn'), value: 'dmn' })
      }
      return opts
    }

    const implTypeOptions = buildOptions()

    function detectType(): ImplType {
      const bo = props.businessObject
      if (!bo) return 'none'
      if (bo.class) return 'class'
      if (bo.expression) return 'expression'
      if (bo.delegateExpression) return 'delegateExpression'
      if (bo.type === 'external') return 'external'
      if (bo.extensionElements?.values?.find((v: any) => v.$type === 'camunda:Connector'))
        return 'connector'
      if (props.showDmn && bo.decisionRef) return 'dmn'
      return 'none'
    }

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) return

      if (props.defaultType) {
        implType.value = props.defaultType
      } else {
        implType.value = detectType()
      }
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function onImplTypeChange(val: string | null) {
      const newType = (val as ImplType) ?? 'class'
      implType.value = newType
      if (!props.bpmnModeler || !props.element) return
      const modeling = props.bpmnModeler.get('modeling')
      const bo = props.businessObject
      if (!bo) return

      const attrs: Record<string, any> = {
        class: undefined,
        expression: undefined,
        delegateExpression: undefined,
        type: undefined,
        topic: undefined,
        taskPriority: undefined,
        decisionRef: undefined,
        decisionRefBinding: undefined,
        decisionRefVersion: undefined,
        decisionRefTenantId: undefined,
        resultVariable: undefined,
      }

      if (newType === 'external') {
        attrs.type = 'external'
        attrs.topic = bo.topic || undefined
        attrs.taskPriority = bo.taskPriority ?? undefined
      }

      if (newType !== 'connector') {
        const conn = bo.extensionElements?.values?.find((v: any) => v.$type === 'camunda:Connector')
        if (conn && bo.extensionElements) {
          bo.extensionElements.values = bo.extensionElements.values.filter((v: any) => v !== conn)
          attrs.extensionElements = bo.extensionElements
        }
      }

      modeling.updateProperties(toRaw(props.element), attrs)
    }

    return () => {
      return (
        <div class="pt-8px">
          {!props.defaultType && (
            <div class="mb-8px">
              <div class="mb-4px text-12px text-#666">
                {t('bpmnPanel.fields.implementationType')}
              </div>
              <NSelect
                value={implType.value}
                onUpdateValue={onImplTypeChange}
                options={implTypeOptions}
                size={props.formSize}
              />
            </div>
          )}

          {implType.value === 'class' && (
            <div class="mb-8px">
              <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.listenerClass')}</div>
              <JavaClassField
                businessObject={props.businessObject}
                element={props.element}
                bpmnModeler={props.bpmnModeler}
                propertyKey="class"
                formSize={props.formSize}
              />
            </div>
          )}

          {implType.value === 'expression' && (
            <div class="mb-8px">
              <ExpressionField
                businessObject={props.businessObject}
                element={props.element}
                bpmnModeler={props.bpmnModeler}
                propertyKey="expression"
                showResultVariable={true}
                resultVariablePropertyKey="resultVariable"
                formSize={props.formSize}
              />
            </div>
          )}

          {implType.value === 'delegateExpression' && (
            <div class="mb-8px">
              <div class="mb-4px text-12px text-#666">
                {t('bpmnPanel.fields.listenerDelegateExpression')}
              </div>
              <DelegateExpressionField
                businessObject={props.businessObject}
                element={props.element}
                bpmnModeler={props.bpmnModeler}
                propertyKey="delegateExpression"
                formSize={props.formSize}
              />
            </div>
          )}

          {implType.value === 'external' && (
            <>
              <ExternalTaskFields
                businessObject={props.businessObject}
                element={props.element}
                bpmnModeler={props.bpmnModeler}
                formSize={props.formSize}
              />
              {props.showExternalErrors && (
                <div class="mt-16px">
                  <div class="text-12px font-bold mb-8px">{t('bpmnPanel.fields.errors')}</div>
                  <ErrorFields
                    businessObject={props.businessObject}
                    element={props.element}
                    bpmnModeler={props.bpmnModeler}
                    formSize={props.formSize}
                  />
                </div>
              )}
            </>
          )}

          {implType.value === 'connector' && (
            <ConnectorFields
              businessObject={props.businessObject}
              element={props.element}
              bpmnModeler={props.bpmnModeler}
              formSize={props.formSize}
            />
          )}

          {implType.value === 'dmn' && (
            <DmnFields
              businessObject={props.businessObject}
              element={props.element}
              bpmnModeler={props.bpmnModeler}
              formSize={props.formSize}
              showResultVariable={true}
            />
          )}
        </div>
      )
    }
  },
})
