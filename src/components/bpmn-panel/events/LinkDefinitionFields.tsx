import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInput } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'

export default defineComponent({
  name: 'LinkDefinitionFields',
  props: {
    // 当前元素的 BPMN 业务对象（BusinessObject），用于读写模型属性
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
    const linkName = ref('')

    function getEventDef() {
      return props.businessObject?.eventDefinitions?.[0]
    }

    function syncFromModel() {
      const def = getEventDef()
      if (!def) return
      linkName.value = def.name || ''
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true, deep: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function onLinkNameChange(val: string | null) {
      linkName.value = val ?? ''
      const ed = getEventDef()
      if (!props.bpmnModeler || !props.element || !ed) return
      const modeling = props.bpmnModeler.get('modeling')
      modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), { name: val ?? '' })
    }

    return () => (
      <div>
        <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.linkName')}</div>
        <NInput
          value={linkName.value}
          onUpdateValue={onLinkNameChange}
          placeholder={t('bpmnPanel.placeholders.linkName')}
          size={props.formSize}
        />
      </div>
    )
  },
})
