import { defineComponent, ref, type PropType } from 'vue'
import { useCamundaI18n } from '../../locales'
import { GeneralPanel } from './base'
import { ProcessContent } from './swimlanes'

export default defineComponent({
  name: 'ProcessPropertiesPancel',
  props: {
    businessObject: {
      type: Object as PropType<any>,
      default: null,
    },
    element: {
      type: Object as PropType<any>,
      default: null,
    },
    bpmnModeler: {
      type: Object,
      default: null,
    },
    formSize: {
      type: String as PropType<'small' | 'medium' | 'large'>,
      default: 'small',
    },
    labelPlacement: {
      type: String as PropType<'left' | 'top'>,
      default: 'left',
    },
  },
  setup(props) {
    const { t } = useCamundaI18n()

    return () => {
      if (!props.businessObject) {
        return (
          <div class="flex items-center justify-center h-full text-#888 text-13px">
            <p>{t('bpmnPanel.panel.noProcess')}</p>
          </div>
        )
      }

      return (
        <div class="p-8px">
          <div class="pt-8px">
            <GeneralPanel
              businessObject={props.businessObject}
              element={props.element}
              bpmnModeler={props.bpmnModeler}
              showExecutable
              formSize={props.formSize}
              labelPlacement={props.labelPlacement}
            />
            <div class="mt-12px">
              <ProcessContent
                element={props.element}
                processBobject={props.businessObject}
                bpmnModeler={props.bpmnModeler}
                formSize={props.formSize}
                showBasic={false}
              />
            </div>
          </div>
        </div>
      )
    }
  },
})
