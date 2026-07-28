import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NCheckbox } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import type { ExtraFieldTab } from '../base'
import EventDefinitionPanel from './EventDefinitionPanel'

export const boundaryEventTabs: ExtraFieldTab[] = [
  { name: 'boundary', labelKey: 'bpmnPanel.tabs.boundary' },
]

export default defineComponent({
  name: 'BoundaryEventExtraFields',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    tabName: { type: String, default: 'boundary' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const cancelActivity = ref(true)

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) return
      cancelActivity.value = bo.cancelActivity !== false
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function onCancelActivityChange(val: boolean) {
      cancelActivity.value = val
      if (!props.bpmnModeler || !props.element) return
      const modeling = props.bpmnModeler.get('modeling')
      modeling.updateProperties(toRaw(props.element), { cancelActivity: val })
    }

    return () => (
      <div class="pt-8px">
        <div class="mb-12px">
          <NCheckbox
            checked={cancelActivity.value}
            onUpdateChecked={onCancelActivityChange}
          >
            {t('bpmnPanel.fields.cancelActivity')}
          </NCheckbox>
        </div>
        <div class="mb-8px text-12px text-#666">{t('bpmnPanel.fields.eventDefinition')}</div>
        <EventDefinitionPanel
          businessObject={props.businessObject}
          element={props.element}
          bpmnModeler={props.bpmnModeler}
          formSize={props.formSize}
        />
      </div>
    )
  },
})
