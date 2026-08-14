import { defineComponent, ref, watch, type PropType } from 'vue'
import { NCheckbox } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useBpmnProperties } from '../../../composables'
import type { ExtraFieldTab } from '../base'
import { HintTooltip } from '../base'

export const subProcessTabs: ExtraFieldTab[] = [
  { name: 'subProcess', labelKey: 'bpmnPanel.tabs.subProcess' },
]

export default defineComponent({
  name: 'SubProcessExtraFields',
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
    tabName: { type: String, default: 'subProcess' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const { updateProperty } = useBpmnProperties(props)
    const triggeredByEvent = ref(false)

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) return
      triggeredByEvent.value = !!bo.triggeredByEvent
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function onTriggeredByEventChange(val: boolean) {
      triggeredByEvent.value = val
      updateProperty('triggeredByEvent', val)
    }

    return () => (
      <div class="pt-8px flex flex-col gap-12px">
        <div class="flex items-center gap-4px">
          <NCheckbox
            checked={triggeredByEvent.value}
            onUpdateChecked={onTriggeredByEventChange}
            size={props.formSize === 'small' ? 'small' : 'medium'}
          >
            {t('bpmnPanel.fields.triggeredByEvent')}
          </NCheckbox>
          <HintTooltip
            label={t('bpmnPanel.fields.triggeredByEvent')}
            hint={t('bpmnPanel.tooltips.triggeredByEvent')}
          />
        </div>
      </div>
    )
  },
})
