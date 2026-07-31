import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInput, NSelect, NCheckbox } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { type ExtraFieldTab } from '../base'

export const adHocSubProcessTabs: ExtraFieldTab[] = [
  { name: 'adHocSubProcess', labelKey: 'bpmnPanel.tabs.adHocSubProcess' },
]

export default defineComponent({
  name: 'AdHocSubProcessExtraFields',
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
    tabName: { type: String, default: 'adHocSubProcess' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const cancelRemainingInstances = ref(false)
    const completionCondition = ref('')

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) return
      cancelRemainingInstances.value = bo.cancelRemainingInstances === true
      completionCondition.value = bo.completionCondition?.body || ''
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true, deep: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function getModeler() {
      return props.bpmnModeler
    }

    function updateProperty(key: string, value: any) {
      if (!getModeler() || !props.element) return
      const modeling = getModeler().get('modeling')
      modeling.updateProperties(toRaw(props.element), { [key]: value })
    }

    function onCancelRemainingInstancesChange(val: boolean) {
      cancelRemainingInstances.value = val
      updateProperty('cancelRemainingInstances', val || undefined)
    }

    function onCompletionConditionChange(val: string | null) {
      completionCondition.value = val ?? ''
      const bo = props.businessObject
      if (!getModeler() || !props.element || !bo) return
      const modeling = getModeler().get('modeling')
      const moddle = getModeler().get('moddle')

      if (!val) {
        modeling.updateModdleProperties(toRaw(props.element), toRaw(bo), {
          completionCondition: undefined,
        })
        return
      }

      const existing = bo.completionCondition
      if (existing) {
        modeling.updateModdleProperties(toRaw(props.element), toRaw(existing), { body: val })
      } else {
        const expr = moddle.create('bpmn:FormalExpression', { body: val })
        modeling.updateModdleProperties(toRaw(props.element), toRaw(bo), {
          completionCondition: expr,
        })
      }
    }

    return () => {
      if (props.tabName === 'adHocSubProcess') {
        return (
          <div class="pt-8px">
            <div class="mb-12px">
              <NCheckbox
                checked={cancelRemainingInstances.value}
                onUpdateChecked={onCancelRemainingInstancesChange}
              >
                {t('bpmnPanel.fields.cancelRemainingInstances')}
              </NCheckbox>
            </div>
            <div class="mb-12px">
              <div class="mb-4px text-12px text-#666">
                {t('bpmnPanel.fields.completionCondition')}
              </div>
              <NInput
                value={completionCondition.value}
                onUpdateValue={onCompletionConditionChange}
                placeholder={t('bpmnPanel.placeholders.completionCondition')}
                size={props.formSize}
                type="textarea"
                rows={3}
              />
            </div>
          </div>
        )
      }
      return null
    }
  },
})
