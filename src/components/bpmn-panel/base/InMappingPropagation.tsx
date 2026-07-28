import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NCheckbox } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'

export default defineComponent({
  name: 'InMappingPropagation',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const propagateAll = ref(false)
    const local = ref(false)

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) return
      const extValues = bo.extensionElements?.values || []
      const inEl = extValues.find((v: any) => v.$type === 'camunda:In' && v.variables === 'all')
      if (inEl) {
        propagateAll.value = true
        local.value = inEl.local === true
      } else {
        propagateAll.value = false
        local.value = false
      }
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true, deep: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function save() {
      if (!props.bpmnModeler || !props.element) return
      const moddle = props.bpmnModeler.get('moddle')
      const modeling = props.bpmnModeler.get('modeling')
      const bo = props.businessObject
      if (!bo) return

      if (!bo.extensionElements) {
        bo.extensionElements = moddle.create('bpmn:ExtensionElements', { values: [] })
      }

      const others = bo.extensionElements.values.filter(
        (v: any) => !(v.$type === 'camunda:In' && v.variables === 'all')
      )

      if (propagateAll.value) {
        others.push(moddle.create('camunda:In', {
          variables: 'all',
          local: local.value || undefined,
        }))
      }

      bo.extensionElements.values = others
      modeling.updateProperties(toRaw(props.element), {
        extensionElements: bo.extensionElements,
      })
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
        <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.inMappingPropagation')}</div>
        <div class="flex items-center gap-12px">
          <NCheckbox
            checked={propagateAll.value}
            onUpdateChecked={onPropagateAllChange}
            size={checkboxSize}
          >
            {t('bpmnPanel.options.propagateAllVariables')}
          </NCheckbox>
          {propagateAll.value && (
            <NCheckbox
              checked={local.value}
              onUpdateChecked={onLocalChange}
              size={checkboxSize}
            >
              {t('bpmnPanel.fields.local')}
            </NCheckbox>
          )}
        </div>
      </div>
    )
  },
})

