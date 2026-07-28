import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInput } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'

export default defineComponent({
  name: 'LinkDefinitionFields',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const linkName = ref('')

    function getEventDef() {
      return props.businessObject?.eventDefinitions?.[0]
    }

    function syncFromModel() {
      const def = getEventDef()
      if (!def) return
      linkName.value = def.name || ''
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true, deep: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function onLinkNameChange(val: string | null) {
      linkName.value = val ?? ''
      const ed = getEventDef()
      if (!props.bpmnModeler || !props.element || !ed) return
      const modeling = props.bpmnModeler.get('modeling')
      modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), { name: val ?? '' })
    }

    return () => (
      <div>
        <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.linkName')}</div>
        <NInput
          value={linkName.value}
          onUpdateValue={onLinkNameChange}
          placeholder={t('bpmnPanel.placeholders.linkName')}
          size={props.formSize}
        />
      </div>
    )
  },
})
