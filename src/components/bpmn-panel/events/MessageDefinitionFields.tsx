import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NInput, NSelect } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useBpmnProperties, useFormSize } from '../../../composables'
import { uid, getDefinitions } from './eventHelpers'

export default defineComponent({
  name: 'MessageDefinitionFields',
  props: {
    // 当前元素的 BPMN 业务对象（BusinessObject），用于读写模型属性
    businessObject: { type: Object as PropType<any>, default: null },
    // 当前选中的 BPMN 图形元素
    element: { type: Object as PropType<any>, default: null },
    // bpmn-js 模型器实例，用于执行建模命令、读写模型
    bpmnModeler: { type: Object, default: null },
    // 表单控件尺寸：small / medium / large
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    // 消息引用属性键名
    messageRefKey: { type: String, default: '' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const { labelClass } = useFormSize(() => props.formSize)
    const { getModdle, updateModdleProperties } = useBpmnProperties(props)
    const selectedMsgId = ref<string | null>(null)
    const selectedMsgName = ref('')
    const messageOptions = ref<{ label: string; value: string }[]>([])

    const msgKey = () => props.messageRefKey || 'messageRef'

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
      if (!target) return
      const moddle = getModdle()

      if (value === '__none__') {
        selectedMsgId.value = null
        selectedMsgName.value = ''
        updateModdleProperties({ [msgKey()]: undefined }, target)
        return
      }

      if (value === '__create__') {
        if (!moddle) return
        const id = uid()
        const newMsg = moddle.create('bpmn:Message', { id, name: id })
        const definitions = getDefinitions(toRaw(props.businessObject))
        if (definitions && definitions.rootElements) {
          definitions.rootElements.push(newMsg)
        }
        selectedMsgId.value = newMsg.id
        selectedMsgName.value = id
        updateModdleProperties({ [msgKey()]: newMsg }, target)
        buildMessageOptions()
        return
      }

      const definitions = getDefinitions(toRaw(props.businessObject))
      const msg = definitions?.rootElements?.find((e: any) => e.id === value)
      if (msg) {
        selectedMsgId.value = value
        selectedMsgName.value = msg.name || ''
        updateModdleProperties({ [msgKey()]: msg }, target)
      }
    }

    function onMessageNameChange(val: string | null) {
      selectedMsgName.value = val ?? ''
      const target = getTarget()
      const ref = target?.[msgKey()]
      if (ref) {
        updateModdleProperties({ name: val ?? '' }, ref)
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
            <div class={`mb-4px ${labelClass}`}>{t('bpmnPanel.fields.messageName')}</div>
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
