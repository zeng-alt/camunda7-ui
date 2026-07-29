import { defineComponent, type PropType } from 'vue'
import { useCamundaI18n } from '../../../locales'
import { type ExtraFieldTab } from '../base'

export const transactionTabs: ExtraFieldTab[] = []

export default defineComponent({
  name: 'TransactionExtraFields',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    tabName: { type: String, default: 'transaction' },
  },
  setup(props) {
    const { t } = useCamundaI18n()

    return () => {
      return null
    }
  },
})
