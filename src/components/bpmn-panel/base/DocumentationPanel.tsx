import { defineComponent, ref, watch, type PropType } from 'vue'
import { NInput, NFormItem, NForm } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useBpmnProperties } from '@/composables'

export default defineComponent({
  name: 'DocumentationPanel',
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
    // 标签位置：left（左侧）/ top（顶部）
    labelPlacement: {
      type: String as PropType<'left' | 'top'>,
      default: 'top',
    },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const documentation = ref('')

    const { getModdle, updateProperties } = useBpmnProperties(props)

    watch(
      () => props.businessObject,
      (bo) => {
        if (!bo) return
        const docs = bo.documentation
        if (docs && docs.length > 0) {
          documentation.value = docs[0].text || ''
        } else {
          documentation.value = ''
        }
      },
      { immediate: true },
    )

    function updateDocumentation(val: string) {
      documentation.value = val
      const bo = props.businessObject
      if (!bo) return

      const doc = val ? [getModdle()?.create('bpmn:Documentation', { text: val })] : []
      updateProperties({ documentation: doc })
    }

    return () => {
      if (!props.businessObject) return null

      return (
        <div class="pt-8px">
          <NFormItem
            size={props.formSize}
            label-placement={props.labelPlacement}
            label={t('bpmnPanel.fields.documentation')}
          >
            <NInput
              value={documentation.value}
              onUpdateValue={updateDocumentation}
              type="textarea"
              placeholder={t('bpmnPanel.placeholders.documentation')}
              rows={4}
              clearable
            />
          </NFormItem>
        </div>
      )
    }
  },
})
