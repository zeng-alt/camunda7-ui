import { defineComponent, ref, watch, type PropType } from 'vue'
import { NInput, NSwitch, NFormItem, NForm } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useBpmnProperties } from '@/composables'

export default defineComponent({
  name: 'GeneralPanel',
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
    // 是否显示可执行（Executable）开关
    showExecutable: {
      type: Boolean,
      default: false,
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
    // 标签宽度
    labelWidth: {
      type: Number,
      default: 80,
    },
    // 是否显示名称输入框
    showName: {
      type: Boolean,
      default: true,
    },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const name = ref('')
    const id = ref('')
    const isExecutable = ref(true)

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) return
      name.value = bo.name || ''
      id.value = (bo.id || props.element?.id) ?? ''
      isExecutable.value = bo.isExecutable !== false
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    const { updateProperty } = useBpmnProperties(props)

    function onNameChange(val: string | null) {
      name.value = val ?? ''
      updateProperty('name', val ?? '')
    }

    function onIdChange(val: string | null) {
      id.value = val ?? ''
      updateProperty('id', val ?? '')
    }

    function onExecutableChange(val: boolean) {
      isExecutable.value = val
      updateProperty('isExecutable', val)
    }

    return () => {
      if (!props.businessObject) return null

      return (
        <NForm
          size={props.formSize}
          label-placement={props.labelPlacement}
          label-align="left"
          label-width={props.labelWidth}
        >
          <NFormItem label={t('bpmnPanel.fields.id')} path="id">
            <NInput
              value={id.value}
              onUpdateValue={onIdChange}
              placeholder={t('bpmnPanel.placeholders.elementId')}
            />
          </NFormItem>
          {props.showName && (
            <NFormItem label={t('bpmnPanel.fields.name')} path="name">
              <NInput
                type="textarea"
                autosize={{ minRows: 1, maxRows: 4 }}
                value={name.value}
                onUpdateValue={onNameChange}
                placeholder={t('bpmnPanel.placeholders.elementName')}
              />
            </NFormItem>
          )}
          {props.showExecutable && (
            <NFormItem label={t('bpmnPanel.fields.executable')} path="isExecutable">
              <NSwitch value={isExecutable.value} onUpdateValue={onExecutableChange} />
            </NFormItem>
          )}
        </NForm>
      )
    }
  },
})
