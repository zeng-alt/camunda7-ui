import { defineComponent, ref, watch, type PropType } from 'vue'
import { NCheckbox } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useBpmnProperties, useFormSize } from '../../../composables'
import type { MappingDirection } from './MappingList'

const config = {
  in: {
    elementType: 'camunda:In',
    heading: 'bpmnPanel.fields.inMappingPropagation',
  },
  out: {
    elementType: 'camunda:Out',
    heading: 'bpmnPanel.fields.outMappingPropagation',
  },
} satisfies Record<MappingDirection, { elementType: string; heading: string }>

export default defineComponent({
  name: 'MappingPropagation',
  props: {
    // 输入（in）或输出（out）映射
    direction: { type: String as PropType<MappingDirection>, required: true },
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
    const { labelClass } = useFormSize(() => props.formSize)
    const { updateProperties, getOrCreateExtensionElements, getModdle } = useBpmnProperties(props)
    const propagateAll = ref(false)
    const local = ref(false)
    const cfg = config[props.direction]

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) return
      const extValues = bo.extensionElements?.values || []
      const el = extValues.find((v: any) => v.$type === cfg.elementType && v.variables === 'all')
      if (el) {
        propagateAll.value = true
        local.value = el.local === true
      } else {
        propagateAll.value = false
        local.value = false
      }
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true, deep: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function save() {
      const moddle = getModdle()
      const ee = getOrCreateExtensionElements()
      if (!moddle || !ee) return

      const others = ee.values.filter(
        (v: any) => !(v.$type === cfg.elementType && v.variables === 'all'),
      )

      if (propagateAll.value) {
        others.push(
          moddle.create(cfg.elementType, {
            variables: 'all',
            local: local.value || undefined,
          }),
        )
      }

      ee.values = others
      updateProperties({ extensionElements: ee })
    }

    function onPropagateAllChange(val: boolean) {
      propagateAll.value = val
      if (!propagateAll.value) local.value = false
      save()
    }

    function onLocalChange(val: boolean) {
      local.value = val
      save()
    }

    const checkboxSize = props.formSize === 'small' ? 'small' : 'medium'

    return () => (
      <div>
        <div class={`mb-4px ${labelClass}`}>{t(cfg.heading)}</div>
        <div class="flex items-center gap-12px">
          <NCheckbox
            checked={propagateAll.value}
            onUpdateChecked={onPropagateAllChange}
            size={checkboxSize}
          >
            {t('bpmnPanel.options.propagateAllVariables')}
          </NCheckbox>
          {propagateAll.value && (
            <NCheckbox checked={local.value} onUpdateChecked={onLocalChange} size={checkboxSize}>
              {t('bpmnPanel.fields.local')}
            </NCheckbox>
          )}
        </div>
      </div>
    )
  },
})
