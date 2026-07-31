import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NTabPane, NInput } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { DocumentationPanel, ExtensionPropertiesPanel, ConfigurableTabs } from '../base'

const GeneralContent = defineComponent({
  name: 'TextAnnotationGeneralContent',
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
    const id = ref('')
    const text = ref('')

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) return
      id.value = (bo.id || props.element?.id) ?? ''
      text.value = bo.text || ''
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function updateProperty(key: string, value: any) {
      if (!props.bpmnModeler || !props.element) return
      const modeling = props.bpmnModeler.get('modeling')
      modeling.updateProperties(toRaw(props.element), { [key]: value })
    }

    function onIdChange(val: string | null) {
      id.value = val ?? ''
      updateProperty('id', val ?? '')
    }

    function onTextChange(val: string | null) {
      text.value = val ?? ''
      updateProperty('text', text.value)
    }

    return () => (
      <div class="pt-8px flex flex-col gap-12px">
        <div>
          <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.id')}</div>
          <NInput
            value={id.value}
            onUpdateValue={onIdChange}
            placeholder={t('bpmnPanel.placeholders.elementId')}
            size={props.formSize}
          />
        </div>
        <div>
          <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.textAnnotationText')}</div>
          <NInput
            type="textarea"
            rows={4}
            value={text.value}
            onUpdateValue={onTextChange}
            placeholder={t('bpmnPanel.placeholders.textAnnotationText')}
            size={props.formSize}
          />
        </div>
        <DocumentationPanel
          businessObject={props.businessObject}
          element={props.element}
          bpmnModeler={props.bpmnModeler}
          formSize={props.formSize}
        />
      </div>
    )
  },
})

export default defineComponent({
  name: 'TextAnnotationPropertiesPanel',
  props: {
    // 当前元素的 BPMN 业务对象（BusinessObject），用于读写模型属性
    businessObject: { type: Object as PropType<any>, default: null },
    // 当前选中的 BPMN 图形元素
    element: { type: Object as PropType<any>, default: null },
    // bpmn-js 模型器实例，用于执行建模命令、读写模型
    bpmnModeler: { type: Object, default: null },
    // 表单控件尺寸：small / medium / large
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    // 标签位置：left（左侧）/ top（顶部）
    labelPlacement: { type: String as PropType<'left' | 'top'>, default: 'left' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const tabValue = ref('general')

    watch(
      () => props.businessObject,
      () => {
        tabValue.value = 'general'
      },
    )

    return () => (
      <div class="p-8px">
        <ConfigurableTabs
          value={tabValue.value}
          onUpdateValue={(v: string) => {
            tabValue.value = v
          }}
          size={props.formSize}
          type="line"
        >
          <NTabPane name="general" tab={t('bpmnPanel.tabs.general')}>
            <GeneralContent {...props} />
          </NTabPane>
          <NTabPane name="extensionProperties" tab={t('bpmnPanel.tabs.extensionProperties')}>
            <div class="pt-8px">
              <ExtensionPropertiesPanel
                businessObject={props.businessObject}
                element={props.element}
                bpmnModeler={props.bpmnModeler}
                formSize={props.formSize}
              />
            </div>
          </NTabPane>
        </ConfigurableTabs>
      </div>
    )
  },
})
