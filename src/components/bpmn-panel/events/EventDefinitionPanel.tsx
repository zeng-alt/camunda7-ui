import { defineComponent, computed, ref, watch, toRaw, type PropType } from 'vue'
import { NInput, NTag, NSelect } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import {
  TimerDefinitionFields,
  ConditionalDefinitionFields,
  MessageDefinitionFields,
  SignalDefinitionFields,
  EscalationDefinitionFields,
  ErrorDefinitionFields,
  CompensationDefinitionFields,
  LinkDefinitionFields,
} from '.'
import { uid, getDefinitions } from './eventHelpers'

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
    Compensate: 'bpmnPanel.eventDef.compensation',
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
  Conditional: 'condition',
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
    'boundary-event': 'bpmn-icon-intermediate-event-catch',
  }
  let prefix = prefixMap[subType] || 'bpmn-icon-event'
  if (subType === 'boundary-event' && businessObject?.cancelActivity === false) {
    prefix = 'bpmn-icon-intermediate-event-catch-non-interrupting'
  }
  return `${prefix}-${suffix}`
}

type RefConfig = {
  refKey: string
  bpmnType: string
  labelAttr: string
  displayAttr: string
}

const refTypeConfig: Record<string, RefConfig> = {
  Error: {
    refKey: 'errorRef',
    bpmnType: 'bpmn:Error',
    labelAttr: 'errorCode',
    displayAttr: 'errorCode',
  },
  Signal: { refKey: 'signalRef', bpmnType: 'bpmn:Signal', labelAttr: 'name', displayAttr: 'name' },
  Escalation: {
    refKey: 'escalationRef',
    bpmnType: 'bpmn:Escalation',
    labelAttr: 'escalationCode',
    displayAttr: 'escalationCode',
  },
}

export default defineComponent({
  name: 'EventDefinitionPanel',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    showVariableEvents: { type: Boolean, default: false },
  },
  setup(props) {
    const { t } = useCamundaI18n()

    const defType = computed(() => getEventDefType(props.businessObject))

    // Ref-based (Error, Escalation)
    const refValue = ref('')
    const refLabel = ref('')

    function syncFromModel() {
      const rawBo = toRaw(props.businessObject)
      if (!rawBo || !rawBo.eventDefinitions || !rawBo.eventDefinitions.length) return
      const def = rawBo.eventDefinitions[0]
      const type = (def.$type || '').replace('bpmn:', '').replace('EventDefinition', '')
      const cfg = refTypeConfig[type]
      if (cfg) {
        const refEl = def[cfg.refKey]
        refValue.value = refEl?.[cfg.displayAttr] || ''
        refLabel.value = t(`bpmnPanel.placeholders.${cfg.refKey}`)
      }
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true, deep: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function getModeler() {
      return props.bpmnModeler
    }

    function onRefValueChange(val: string | null) {
      const value = val ?? ''
      refValue.value = value

      const type = defType.value
      debugger
      const cfg = refTypeConfig[type]
      if (!cfg) return

      const ed = props.businessObject?.eventDefinitions?.[0]
      if (!getModeler() || !props.element || !ed) return
      const modeling = getModeler().get('modeling')
      const moddle = getModeler().get('moddle')

      if (!value) {
        modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), {
          [cfg.refKey]: undefined,
        })
        return
      }

      const existingRef = ed[cfg.refKey]
      if (existingRef) {
        modeling.updateModdleProperties(toRaw(props.element), toRaw(existingRef), {
          [cfg.labelAttr]: value,
        })
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
        return <div class="pt-8px text-12px text-#888">{t('bpmnPanel.eventDef.noEventDef')}</div>
      }

      if (type === 'Timer') {
        return (
          <TimerDefinitionFields
            businessObject={props.businessObject}
            element={props.element}
            bpmnModeler={props.bpmnModeler}
            formSize={props.formSize}
          />
        )
      }

      if (type === 'Conditional') {
        return (
          <ConditionalDefinitionFields
            businessObject={props.businessObject}
            element={props.element}
            bpmnModeler={props.bpmnModeler}
            formSize={props.formSize}
            showVariableEvents={props.showVariableEvents}
          />
        )
      }

      if (type === 'Link') {
        return (
          <LinkDefinitionFields
            businessObject={props.businessObject}
            element={props.element}
            bpmnModeler={props.bpmnModeler}
            formSize={props.formSize}
          />
        )
      }

      if (type === 'Cancel' || type === 'Terminate') {
        return <div class="text-12px text-#888">{t('bpmnPanel.eventDef.noConfig')}</div>
      }

      if (type === 'Compensate') {
        return (
          <CompensationDefinitionFields
            businessObject={props.businessObject}
            element={props.element}
            bpmnModeler={props.bpmnModeler}
            formSize={props.formSize}
          />
        )
      }

      if (type === 'Message') {
        return (
          <MessageDefinitionFields
            businessObject={props.businessObject}
            element={props.element}
            bpmnModeler={props.bpmnModeler}
            formSize={props.formSize}
          />
        )
      }

      if (type === 'Signal') {
        return (
          <SignalDefinitionFields
            businessObject={props.businessObject}
            element={props.element}
            bpmnModeler={props.bpmnModeler}
            formSize={props.formSize}
          />
        )
      }

      if (type === 'Error') {
        return (
          <ErrorDefinitionFields
            businessObject={props.businessObject}
            element={props.element}
            bpmnModeler={props.bpmnModeler}
            formSize={props.formSize}
          />
        )
      }

      if (type === 'Escalation') {
        return (
          <EscalationDefinitionFields
            businessObject={props.businessObject}
            element={props.element}
            bpmnModeler={props.bpmnModeler}
            formSize={props.formSize}
          />
        )
      }

      if (type === 'Multiple' || type === 'ParallelMultiple') {
        const ed = props.businessObject?.eventDefinitions?.[0]
        const childDefs = ed?.eventDefinitions
        const childTypes =
          childDefs?.map((d: any) => {
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
              <div class="text-12px text-#888">{t('bpmnPanel.eventDef.multipleEmpty')}</div>
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
