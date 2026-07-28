import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInput } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import type { ExtraFieldTab } from '../base'
import FormPanel from '../base/FormPanel'
import EventDefinitionPanel from './EventDefinitionPanel'

export const startEventTabs: ExtraFieldTab[] = [
  { name: 'startEvent', labelKey: 'bpmnPanel.tabs.startEvent' },
  { name: 'forms', labelKey: 'bpmnPanel.tabs.forms' },
]

export default defineComponent({
  name: 'StartEventExtraFields',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    tabName: { type: String, default: 'startEvent' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const initiator = ref('')

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) return
      initiator.value = bo.initiator || ''
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function updateProperty(key: string, value: any) {
      if (!props.bpmnModeler || !props.element) return
      const modeling = props.bpmnModeler.get('modeling')
      modeling.updateProperties(toRaw(props.element), { [key]: value })
    }

    function onInitiatorChange(val: string | null) {
      initiator.value = val ?? ''
      updateProperty('initiator', val ?? '')
    }

    return () => {
      if (props.tabName === 'forms') {
        return (
          <div class="pt-8px">
            <FormPanel
              businessObject={props.businessObject}
              element={props.element}
              bpmnModeler={props.bpmnModeler}
              formSize={props.formSize}
            />
          </div>
        )
      }

      return (
        <div class="pt-8px">
          <div class="mt-12px">
            <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.initiator')}</div>
            <NInput
              value={initiator.value}
              onUpdateValue={onInitiatorChange}
              placeholder={t('bpmnPanel.placeholders.initiator')}
              size={props.formSize}
            />
          </div>
          <div class="mt-16px">
            <div class="mb-8px text-12px text-#666">{t('bpmnPanel.fields.eventDefinition')}</div>
            <EventDefinitionPanel
              businessObject={props.businessObject}
              element={props.element}
              bpmnModeler={props.bpmnModeler}
              formSize={props.formSize}
            />
          </div>
        </div>
      )
    }
  },
})
