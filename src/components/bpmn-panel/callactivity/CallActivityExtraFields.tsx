import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInput, NCheckbox } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import type { ExtraFieldTab } from '../base'

export const callActivityTabs: ExtraFieldTab[] = [
  { name: 'callActivity', labelKey: 'bpmnPanel.tabs.callActivity' },
]

export default defineComponent({
  name: 'CallActivityExtraFields',
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
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const calledElement = ref('')
    const versionTag = ref('')
    const eplitAllowed = ref(false)

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) return
      calledElement.value = bo.calledElement || ''
      versionTag.value = bo.versionTag || ''
      eplitAllowed.value = bo.eplitAllowed === true
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function updateProperty(key: string, value: any) {
      if (!props.bpmnModeler || !props.element) return
      const modeling = props.bpmnModeler.get('modeling')
      modeling.updateProperties(toRaw(props.element), { [key]: value })
    }

    function onCalledElementChange(val: string | null) {
      calledElement.value = val ?? ''
      updateProperty('calledElement', val ?? '')
    }

    function onVersionTagChange(val: string | null) {
      versionTag.value = val ?? ''
      updateProperty('versionTag', val ?? '')
    }

    function onEplitAllowedChange(val: boolean) {
      eplitAllowed.value = val
      updateProperty('eplitAllowed', val)
    }

    return () => (
      <div class="pt-8px">
        <div class="mt-12px">
          <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.calledElement')}</div>
          <NInput
            value={calledElement.value}
            onUpdateValue={onCalledElementChange}
            placeholder={t('bpmnPanel.placeholders.calledElement')}
            size={props.formSize}
          />
        </div>
        <div class="mt-12px">
          <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.versionTag')}</div>
          <NInput
            value={versionTag.value}
            onUpdateValue={onVersionTagChange}
            placeholder={t('bpmnPanel.placeholders.versionTag')}
            size={props.formSize}
          />
        </div>
        <div class="mt-12px">
          <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.eplitAllowed')}</div>
          <NCheckbox
            checked={eplitAllowed.value}
            onUpdateChecked={onEplitAllowedChange}
            size={props.formSize === 'small' ? 'small' : 'medium'}
          >
            {t('bpmnPanel.fields.eplitAllowed')}
          </NCheckbox>
        </div>
      </div>
    )
  },
})
