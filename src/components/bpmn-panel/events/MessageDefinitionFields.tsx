import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInput, NSelect } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { uid, getDefinitions } from './eventHelpers'

export default defineComponent({
  name: 'MessageDefinitionFields',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    messageRefKey: { type: String, default: '' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const selectedMsgId = ref<string | null>(null)
    const selectedMsgName = ref('')
    const messageOptions = ref<{ label: string; value: string }[]>([])

    const msgKey = () => props.messageRefKey || 'messageRef'

    function getModeler() {
      return props.bpmnModeler
    }

    function getTarget() {
      return props.messageRefKey
        ? props.businessObject
        : props.businessObject?.eventDefinitions?.[0]
    }

    function buildMessageOptions() {
      const definitions = getDefinitions(toRaw(props.businessObject))
      const elements =
        definitions?.rootElements?.filter((e: any) => e.$type === 'bpmn:Message') || []
      const opts: { label: string; value: string }[] = [
        { label: t('bpmnPanel.eventDef.none'), value: '__none__' },
        { label: t('bpmnPanel.eventDef.createNew'), value: '__create__' },
      ]
      for (const el of elements) {
        opts.push({ label: el.name || el.id || 'Unnamed', value: el.id })
      }
      messageOptions.value = opts
    }

    function syncFromModel() {
      const target = getTarget()
      if (!target) return
      selectedMsgId.value = target[msgKey()]?.id || null
      selectedMsgName.value = target[msgKey()]?.name || ''
      buildMessageOptions()
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true, deep: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function onMessageSelect(value: string) {
      const target = getTarget()
      if (!getModeler() || !props.element || !target) return
      const modeling = getModeler().get('modeling')
      const moddle = getModeler().get('moddle')

      if (value === '__none__') {
        selectedMsgId.value = null
        selectedMsgName.value = ''
        modeling.updateModdleProperties(toRaw(props.element), toRaw(target), {
          [msgKey()]: undefined,
        })
        return
      }

      if (value === '__create__') {
        const id = uid()
        const newMsg = moddle.create('bpmn:Message', { id, name: id })
        const definitions = getDefinitions(toRaw(props.businessObject))
        if (definitions && definitions.rootElements) {
          definitions.rootElements.push(newMsg)
        }
        selectedMsgId.value = newMsg.id
        selectedMsgName.value = id
        modeling.updateModdleProperties(toRaw(props.element), toRaw(target), { [msgKey()]: newMsg })
        buildMessageOptions()
        return
      }

      const definitions = getDefinitions(toRaw(props.businessObject))
      const msg = definitions?.rootElements?.find((e: any) => e.id === value)
      if (msg) {
        selectedMsgId.value = value
        selectedMsgName.value = msg.name || ''
        modeling.updateModdleProperties(toRaw(props.element), toRaw(target), { [msgKey()]: msg })
      }
    }

    function onMessageNameChange(val: string | null) {
      selectedMsgName.value = val ?? ''
      const target = getTarget()
      const ref = target?.[msgKey()]
      if (ref && getModeler() && props.element) {
        const modeling = getModeler().get('modeling')
        modeling.updateModdleProperties(toRaw(props.element), ref, { name: val ?? '' })
        buildMessageOptions()
      }
    }

    return () => (
      <div>
        <NSelect
          value={selectedMsgId.value}
          onUpdateValue={onMessageSelect}
          options={messageOptions.value}
          size={props.formSize}
          placeholder={t('bpmnPanel.placeholders.messageRef')}
        />
        {selectedMsgId.value && (
          <div class="mt-8px">
            <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.messageName')}</div>
            <NInput
              value={selectedMsgName.value}
              onUpdateValue={onMessageNameChange}
              placeholder={t('bpmnPanel.fields.messageName')}
              size={props.formSize}
            />
          </div>
        )}
      </div>
    )
  },
})
