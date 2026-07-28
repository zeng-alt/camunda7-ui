import { defineComponent, type PropType } from 'vue'
import { useCamundaI18n } from '../../../locales'
import type { ExtraFieldTab } from '../base'
import EventDefinitionPanel from './EventDefinitionPanel'

export const endEventTabs: ExtraFieldTab[] = [
  { name: 'endEvent', labelKey: 'bpmnPanel.tabs.endEvent' },
]

export default defineComponent({
  name: 'EndEventExtraFields',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    tabName: { type: String, default: 'endEvent' },
  },
  setup(props) {
    const { t } = useCamundaI18n()

    return () => (
      <div class="pt-8px">
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
