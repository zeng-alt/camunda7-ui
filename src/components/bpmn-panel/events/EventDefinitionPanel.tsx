import { defineComponent, computed, ref, watch, toRaw, type PropType } from 'vue'
import { NInput, NRadioGroup, NRadio, NSpace, NTag, NSelect } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { HintTooltip, ScriptFields, ExpressionField } from '../base'

function uid(): string {
  return `ed_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

function getDefinitions(bo: any): any {
  let cur = bo
  while (cur) {
    if (cur.$type === 'bpmn:Definitions') return cur
    cur = cur.$parent
  }
  return null
}

export function getEventDefType(businessObject: any): string {
  if (!businessObject) return 'none'
  const defs = businessObject.eventDefinitions
  if (!defs || !defs.length) return 'none'
  return (defs[0].$type || '').replace('bpmn:', '').replace('EventDefinition', '')
}

export function getEventDefLabelKey(type: string): string {
  const map: Record<string, string> = {
    none: 'bpmnPanel.eventDef.none',
    Message: 'bpmnPanel.eventDef.message',
    Timer: 'bpmnPanel.eventDef.timer',
    Error: 'bpmnPanel.eventDef.error',
    Signal: 'bpmnPanel.eventDef.signal',
    Conditional: 'bpmnPanel.eventDef.conditional',
    Link: 'bpmnPanel.eventDef.link',
    Escalation: 'bpmnPanel.eventDef.escalation',
    Cancel: 'bpmnPanel.eventDef.cancel',
    Terminate: 'bpmnPanel.eventDef.terminate',
    Compensation: 'bpmnPanel.eventDef.compensation',
    Multiple: 'bpmnPanel.eventDef.multiple',
    ParallelMultiple: 'bpmnPanel.eventDef.parallelMultiple',
  }
  return map[type] || 'bpmnPanel.eventDef.none'
}

export function getCategoryLabelKey(subType: string): string {
  const map: Record<string, string> = {
    'start-event': 'bpmnPanel.categories.startEvent',
    'intermediate-catch-event': 'bpmnPanel.categories.intermediateCatchEvent',
    'intermediate-throw-event': 'bpmnPanel.categories.intermediateThrowEvent',
    'boundary-event': 'bpmnPanel.categories.boundaryEvent',
    'end-event': 'bpmnPanel.categories.endEvent',
  }
  return map[subType] || 'bpmnPanel.categories.startEvent'
}

const defIconSuffix: Record<string, string> = {
  none: 'none',
  Message: 'message',
  Timer: 'timer',
  Error: 'error',
  Signal: 'signal',
  Conditional: 'conditional',
  Link: 'link',
  Escalation: 'escalation',
  Cancel: 'cancel',
  Terminate: 'terminate',
  Compensation: 'compensation',
  Multiple: 'multiple',
  ParallelMultiple: 'parallel-multiple',
}

export function getEventIcon(subType: string, businessObject: any): string {
  const defType = getEventDefType(businessObject)
  const suffix = defIconSuffix[defType] || 'none'
  const prefixMap: Record<string, string> = {
    'start-event': 'bpmn-icon-start-event',
    'end-event': 'bpmn-icon-end-event',
    'intermediate-catch-event': 'bpmn-icon-intermediate-event-catch',
    'intermediate-throw-event': 'bpmn-icon-intermediate-event-throw',
    'boundary-event': 'bpmn-icon-boundary-event',
  }
  const prefix = prefixMap[subType] || 'bpmn-icon-event'
  return `${prefix}-${suffix}`
}

type RefConfig = {
  refKey: string
  bpmnType: string
  labelAttr: string
  displayAttr: string
}

const refTypeConfig: Record<string, RefConfig> = {
  Error: { refKey: 'errorRef', bpmnType: 'bpmn:Error', labelAttr: 'errorCode', displayAttr: 'errorCode' },
  Signal: { refKey: 'signalRef', bpmnType: 'bpmn:Signal', labelAttr: 'name', displayAttr: 'name' },
  Escalation: { refKey: 'escalationRef', bpmnType: 'bpmn:Escalation', labelAttr: 'escalationCode', displayAttr: 'escalationCode' },
}

export default defineComponent({
  name: 'EventDefinitionPanel',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
  },
  setup(props) {
    const { t } = useCamundaI18n()

    const defType = computed(() => getEventDefType(props.businessObject))

    // Timer
    const timerActiveField = ref('timeDuration')
    const timerValue = ref('')

    // Link
    const linkName = ref('')

    // Conditional
    const conditionType = ref<'none' | 'expression' | 'script'>('none')
    const variableName = ref('')
    const conditionExpr = ref('')
    const scriptFormat = ref('js')
    const scriptValue = ref('')

    // Ref-based (Message, Error, Signal, Escalation)
    const refValue = ref('')
    const refLabel = ref('')

    // Compensation
    const activityRef = ref('')

    // Message
    const selectedMsgId = ref<string | null>(null)
    const selectedMsgName = ref('')
    const messageOptions = ref<{ label: string; value: string }[]>([])

    // Signal
    const selectedSignalId = ref<string | null>(null)
    const selectedSignalName = ref('')
    const signalOptions = ref<{ label: string; value: string }[]>([])

    function buildRootElementOptions(elementType: string): { label: string; value: string }[] {
      const definitions = getDefinitions(toRaw(props.businessObject))
      const elements = definitions?.rootElements?.filter((e: any) => e.$type === elementType) || []
      const opts: { label: string; value: string }[] = [
        { label: t('bpmnPanel.eventDef.none'), value: '__none__' },
        { label: t('bpmnPanel.eventDef.createNew'), value: '__create__' },
      ]
      for (const el of elements) {
        opts.push({ label: el.name || el.id || 'Unnamed', value: el.id })
      }
      return opts
    }

    function buildMessageOptions() {
      messageOptions.value = buildRootElementOptions('bpmn:Message')
    }

    function buildSignalOptions() {
      signalOptions.value = buildRootElementOptions('bpmn:Signal')
    }

    function syncFromModel() {
      const rawBo = toRaw(props.businessObject)
      if (!rawBo || !rawBo.eventDefinitions || !rawBo.eventDefinitions.length) return
      const def = rawBo.eventDefinitions[0]
      const type = (def.$type || '').replace('bpmn:', '').replace('EventDefinition', '')

      if (type === 'Timer') {
        if (def.timeDate?.body) {
          timerActiveField.value = 'timeDate'
          timerValue.value = def.timeDate.body
        } else if (def.timeDuration?.body) {
          timerActiveField.value = 'timeDuration'
          timerValue.value = def.timeDuration.body
        } else if (def.timeCycle?.body) {
          timerActiveField.value = 'timeCycle'
          timerValue.value = def.timeCycle.body
        } else {
          timerActiveField.value = 'none'
          timerValue.value = ''
        }
      } else if (type === 'Link') {
        linkName.value = def.name || ''
      } else if (type === 'Conditional') {
        variableName.value = def.variableName || ''
        const cond = def.condition
        if (!cond) {
          conditionType.value = 'none'
          conditionExpr.value = ''
          scriptValue.value = ''
        } else if (cond.language) {
          conditionType.value = 'script'
          scriptFormat.value = cond.language
          scriptValue.value = cond.body || ''
          conditionExpr.value = ''
        } else {
          conditionType.value = 'expression'
          conditionExpr.value = cond.body || ''
          scriptValue.value = ''
        }
      } else if (type === 'Message') {
        selectedMsgId.value = def.messageRef?.id || null
        selectedMsgName.value = def.messageRef?.name || ''
        buildMessageOptions()
      } else if (type === 'Signal') {
        selectedSignalId.value = def.signalRef?.id || null
        selectedSignalName.value = def.signalRef?.name || ''
        buildSignalOptions()
      } else if (type === 'Compensation') {
        activityRef.value = def.activityRef?.id || ''
      } else {
        const cfg = refTypeConfig[type]
        if (cfg) {
          const refEl = def[cfg.refKey]
          refValue.value = refEl?.[cfg.displayAttr] || ''
          refLabel.value = t(`bpmnPanel.placeholders.${cfg.refKey}`)
        }
      }
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true, deep: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function getModeler() {
      return props.bpmnModeler
    }

    function updateDefProperty(key: string, value: any) {
      const ed = props.businessObject?.eventDefinitions?.[0]
      if (!getModeler() || !props.element || !ed) return
      const modeling = getModeler().get('modeling')
      modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), { [key]: value })
    }

    function onTimerTypeChange(field: string) {
      const ed = props.businessObject?.eventDefinitions?.[0]
      if (!getModeler() || !props.element || !ed) return
      const modeling = getModeler().get('modeling')

      if (field === 'none') {
        timerActiveField.value = 'none'
        timerValue.value = ''
        modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), {
          timeDate: undefined,
          timeDuration: undefined,
          timeCycle: undefined,
        })
        return
      }

      const moddle = getModeler().get('moddle')

      const oldFields = ['timeDate', 'timeDuration', 'timeCycle']
      const cleanup: Record<string, any> = {}
      for (const f of oldFields) {
        if (f !== field) cleanup[f] = undefined
      }

      if (timerValue.value) {
        cleanup[field] = moddle.create('bpmn:FormalExpression', { body: timerValue.value })
      }

      modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), cleanup)
      timerActiveField.value = field
    }

    function onTimerValueChange(val: string | null) {
      timerValue.value = val ?? ''
      if (timerActiveField.value === 'none') return
      const ed = props.businessObject?.eventDefinitions?.[0]
      if (!getModeler() || !props.element || !ed) return
      const modeling = getModeler().get('modeling')
      const moddle = getModeler().get('moddle')

      const existing = ed[timerActiveField.value]
      if (existing) {
        modeling.updateModdleProperties(toRaw(props.element), toRaw(existing), { body: val ?? '' })
      } else if (val) {
        const expr = moddle.create('bpmn:FormalExpression', { body: val })
        modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), {
          [timerActiveField.value]: expr,
        })
      }
    }

    function saveCondition() {
      if (conditionType.value === 'none') {
        updateDefProperty('condition', undefined)
        return
      }
      const ed = props.businessObject?.eventDefinitions?.[0]
      if (!getModeler() || !props.element || !ed) return
      const modeling = getModeler().get('modeling')
      const moddle = getModeler().get('moddle')

      const attrs: Record<string, any> = {}
      if (conditionType.value === 'script') {
        attrs.language = scriptFormat.value
        attrs.body = scriptValue.value
      } else {
        attrs.body = conditionExpr.value
      }

      const existing = ed.condition
      if (existing) {
        modeling.updateModdleProperties(toRaw(props.element), toRaw(existing), attrs)
      } else if (attrs.body) {
        const expr = moddle.create('bpmn:FormalExpression', attrs)
        modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), { condition: expr })
      }
    }

    function onVariableNameChange(val: string | null) {
      variableName.value = val ?? ''
      updateDefProperty('variableName', val ?? '')
    }

    function onConditionTypeChange(val: string | null) {
      const t = (val as 'none' | 'expression' | 'script') ?? 'none'
      conditionType.value = t
      if (t === 'none') {
        conditionExpr.value = ''
        scriptValue.value = ''
        updateDefProperty('condition', undefined)
      }
    }

    function onConditionExprChange(val: string | null) {
      conditionExpr.value = val ?? ''
      saveCondition()
    }

    function onScriptFormatChange(val: string | null) {
      scriptFormat.value = val ?? 'js'
      if (conditionType.value === 'script') saveCondition()
    }

    function onScriptValueChange(val: string | null) {
      scriptValue.value = val ?? ''
      if (conditionType.value === 'script') saveCondition()
    }

    function onLinkNameChange(val: string | null) {
      linkName.value = val ?? ''
      updateDefProperty('name', val ?? '')
    }

    function onActivityRefChange(val: string | null) {
      activityRef.value = val ?? ''
      const ed = props.businessObject?.eventDefinitions?.[0]
      if (!getModeler() || !props.element || !ed) return
      const modeling = getModeler().get('modeling')

      if (!val) {
        modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), { activityRef: undefined })
        return
      }

      const moddle = getModeler().get('moddle')
      const ref = moddle.create('bpmn:Activity', { id: val })
      modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), { activityRef: ref })
    }

    function onMessageSelect(value: string) {
      const ed = props.businessObject?.eventDefinitions?.[0]
      if (!getModeler() || !props.element || !ed) return
      const modeling = getModeler().get('modeling')
      const moddle = getModeler().get('moddle')

      if (value === '__none__') {
        selectedMsgId.value = null
        selectedMsgName.value = ''
        modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), { messageRef: undefined })
        return
      }

      if (value === '__create__') {
        const id = uid()
        const newMsg = moddle.create('bpmn:Message', { id, name: id })
        const rawBo = toRaw(props.businessObject)
        const definitions = getDefinitions(rawBo)
        if (definitions && definitions.rootElements) {
          definitions.rootElements.push(newMsg)
        }
        selectedMsgId.value = newMsg.id
        selectedMsgName.value = id
        modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), { messageRef: newMsg })
        buildMessageOptions()
        return
      }

      const rawBo = toRaw(props.businessObject)
      const definitions = getDefinitions(rawBo)
      const msg = definitions?.rootElements?.find((e: any) => e.id === value)
      if (msg) {
        selectedMsgId.value = value
        selectedMsgName.value = msg.name || ''
        modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), { messageRef: msg })
      }
    }

    function onMessageNameChange(val: string | null) {
      selectedMsgName.value = val ?? ''
      const rawBo = toRaw(props.businessObject)
      const ed = rawBo?.eventDefinitions?.[0]
      const ref = ed?.messageRef
      if (ref && getModeler() && props.element) {
        const modeling = getModeler().get('modeling')
        modeling.updateModdleProperties(toRaw(props.element), ref, { name: val ?? '' })
        buildMessageOptions()
      }
    }

    function onSignalSelect(value: string) {
      const ed = props.businessObject?.eventDefinitions?.[0]
      if (!getModeler() || !props.element || !ed) return
      const modeling = getModeler().get('modeling')
      const moddle = getModeler().get('moddle')

      if (value === '__none__') {
        selectedSignalId.value = null
        selectedSignalName.value = ''
        modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), { signalRef: undefined })
        return
      }

      if (value === '__create__') {
        const name = 'newSignal'
        const newSignal = moddle.create('bpmn:Signal', { id: uid(), name })
        const definitions = getDefinitions(props.businessObject)
        if (definitions && definitions.rootElements) {
          definitions.rootElements.push(newSignal)
        }
        selectedSignalId.value = newSignal.id
        selectedSignalName.value = name
        modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), { signalRef: newSignal })
        buildSignalOptions()
        return
      }

      const rawBo = toRaw(props.businessObject)
      const definitions = getDefinitions(rawBo)
      const sig = definitions?.rootElements?.find((e: any) => e.id === value)
      if (sig) {
        selectedSignalId.value = value
        selectedSignalName.value = sig.name || ''
        modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), { signalRef: sig })
      }
    }

    function onSignalNameChange(val: string | null) {
      selectedSignalName.value = val ?? ''
      const rawBo = toRaw(props.businessObject)
      const ed = rawBo?.eventDefinitions?.[0]
      const ref = ed?.signalRef
      if (ref && getModeler() && props.element) {
        const modeling = getModeler().get('modeling')
        modeling.updateModdleProperties(toRaw(props.element), ref, { name: val ?? '' })
        buildSignalOptions()
      }
    }

    function onRefValueChange(val: string | null) {
      const value = val ?? ''
      refValue.value = value

      const type = defType.value
      const cfg = refTypeConfig[type]
      if (!cfg) return

      const ed = props.businessObject?.eventDefinitions?.[0]
      if (!getModeler() || !props.element || !ed) return
      const modeling = getModeler().get('modeling')
      const moddle = getModeler().get('moddle')

      if (!value) {
        modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), { [cfg.refKey]: undefined })
        return
      }

      const existingRef = ed[cfg.refKey]
      if (existingRef) {
        modeling.updateModdleProperties(toRaw(props.element), toRaw(existingRef), { [cfg.labelAttr]: value })
        return
      }

      const newRef = moddle.create(cfg.bpmnType, {
        id: uid(),
        [cfg.labelAttr]: value,
      })

      const definitions = getDefinitions(props.businessObject)
      if (definitions && definitions.rootElements) {
        definitions.rootElements.push(newRef)
      }

      modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), { [cfg.refKey]: newRef })
    }

    return () => {
      const type = defType.value

      if (type === 'none') {
        return (
          <div class="pt-8px text-12px text-#888">
            {t('bpmnPanel.eventDef.noEventDef')}
          </div>
        )
      }

      if (type === 'Timer') {
        return (
          <div>
            <div class="mb-8px">
              <NRadioGroup value={timerActiveField.value} onUpdateValue={onTimerTypeChange}>
                <NSpace>
                  <NRadio value="none">{t('bpmnPanel.eventDef.none')}</NRadio>
                  <div class="flex items-center gap-2px">
                    <NRadio value="timeDate" />
                    <HintTooltip
                      label={t('bpmnPanel.fields.timerDate')}
                      hint={t('bpmnPanel.tooltips.timerDate')}
                    />
                  </div>
                  <div class="flex items-center gap-2px">
                    <NRadio value="timeDuration" />
                    <HintTooltip
                      label={t('bpmnPanel.fields.timerDuration')}
                      hint={t('bpmnPanel.tooltips.timerDuration')}
                    />
                  </div>
                  <div class="flex items-center gap-2px">
                    <NRadio value="timeCycle" />
                    <HintTooltip
                      label={t('bpmnPanel.fields.timerCycle')}
                      hint={t('bpmnPanel.tooltips.timerCycle')}
                    />
                  </div>
                </NSpace>
              </NRadioGroup>
            </div>
            {timerActiveField.value !== 'none' && (
              <NInput
                value={timerValue.value}
                onUpdateValue={onTimerValueChange}
                placeholder={t('bpmnPanel.placeholders.' + timerActiveField.value)}
                size={props.formSize}
              />
            )}
          </div>
        )
      }

      if (type === 'Conditional') {
        return (
          <div>
            <div class="mb-8px">
              <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.variableName')}</div>
              <NInput
                value={variableName.value}
                onUpdateValue={onVariableNameChange}
                placeholder={t('bpmnPanel.placeholders.variableName')}
                size={props.formSize}
              />
            </div>
            <div class="mb-8px">
              <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.conditionType')}</div>
              <NSelect
                value={conditionType.value}
                onUpdateValue={onConditionTypeChange}
                options={[
                  { label: 'None', value: 'none' },
                  { label: 'Expression', value: 'expression' },
                  { label: 'Script', value: 'script' },
                ]}
                size={props.formSize}
              />
            </div>
            {conditionType.value === 'expression' && (
              <ExpressionField
                value={conditionExpr.value}
                onUpdateValue={onConditionExprChange}
                formSize={props.formSize}
                textarea
              />
            )}
            {conditionType.value === 'script' && (
              <ScriptFields
                scriptFormat={scriptFormat.value}
                scriptValue={scriptValue.value}
                onUpdateScriptFormat={onScriptFormatChange}
                onUpdateScriptValue={onScriptValueChange}
                formSize={props.formSize}
              />
            )}
          </div>
        )
      }

      if (type === 'Link') {
        return (
          <div>
            <NInput
              value={linkName.value}
              onUpdateValue={onLinkNameChange}
              placeholder={t('bpmnPanel.placeholders.linkName')}
              size={props.formSize}
            />
          </div>
        )
      }

      if (type === 'Cancel' || type === 'Terminate') {
        return (
          <div class="text-12px text-#888">
            {t('bpmnPanel.eventDef.noConfig')}
          </div>
        )
      }

      if (type === 'Compensation') {
        return (
          <div>
            <NInput
              value={activityRef.value}
              onUpdateValue={onActivityRefChange}
              placeholder={t('bpmnPanel.placeholders.activityRef')}
              size={props.formSize}
            />
          </div>
        )
      }

      if (type === 'Message') {
        return (
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
      }

      if (type === 'Signal') {
        return (
          <div>
            <NSelect
              value={selectedSignalId.value}
              onUpdateValue={onSignalSelect}
              options={signalOptions.value}
              size={props.formSize}
              placeholder={t('bpmnPanel.placeholders.signalRef')}
            />
            {selectedSignalId.value && (
              <div class="mt-8px">
                <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.signalName')}</div>
                <NInput
                  value={selectedSignalName.value}
                  onUpdateValue={onSignalNameChange}
                  placeholder={t('bpmnPanel.fields.signalName')}
                  size={props.formSize}
                />
              </div>
            )}
          </div>
        )
      }

      if (type === 'Multiple' || type === 'ParallelMultiple') {
        const ed = props.businessObject?.eventDefinitions?.[0]
        const childDefs = ed?.eventDefinitions
        const childTypes = childDefs?.map((d: any) => {
          const raw = (d.$type || '').replace('bpmn:', '').replace('EventDefinition', '')
          return t(getEventDefLabelKey(raw))
        }) || []

        return (
          <div>
            {childTypes.length > 0 ? (
              <div class="flex flex-wrap gap-4px">
                {childTypes.map((label: string) => (
                  <NTag size="small">{label}</NTag>
                ))}
              </div>
            ) : (
              <div class="text-12px text-#888">
                {t('bpmnPanel.eventDef.multipleEmpty')}
              </div>
            )}
          </div>
        )
      }

      const cfg = refTypeConfig[type]
      if (cfg) {
        return (
          <div>
            <NInput
              value={refValue.value}
              onUpdateValue={onRefValueChange}
              placeholder={t(`bpmnPanel.placeholders.${cfg.refKey}`)}
              size={props.formSize}
            />
          </div>
        )
      }

      return null
    }
  },
})
