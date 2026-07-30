import { defineComponent, ref, computed, watch, toRaw, type PropType } from 'vue'
import {
  NCheckbox, NInput, NInputNumber, NSelect, NDatePicker,
  NRadioGroup, NRadioButton, NRadio, NTooltip,
} from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import type { ExtraFieldTab } from '../base'
import { UserPicker, GroupPicker, FormPanel, TaskListenersPanel } from '../base'

export const userTaskTabs: ExtraFieldTab[] = [
  { name: 'userTask', labelKey: 'bpmnPanel.tabs.userTask' },
  { name: 'forms', labelKey: 'bpmnPanel.tabs.forms' },
  { name: 'taskListeners', labelKey: 'bpmnPanel.tabs.taskListeners' },
]

export default defineComponent({
  name: 'UserTaskExtraFields',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    tabName: { type: String, default: 'userTask' },
    userResolver: { type: String, default: 'approverResolver.getUsers' },
    groupResolver: { type: String, default: 'approverResolver.getUserGroups' },
  },
  setup(props) {
    const { t } = useCamundaI18n()

    const enabled = ref(false)
    const panelMode = ref<'normal' | 'advanced'>('normal')
    const executionMode = ref<'countersign' | 'orsign' | 'sequential'>('countersign')
    const approverMode = ref<'variable' | 'user' | 'group' | 'formField'>('variable')
    const approverValue = ref('')
    const allowAddSign = ref(false)
    const allowTransfer = ref(false)
    const allowDelegate = ref(false)
    const allowReject = ref(false)
    const allowCopy = ref(false)
    const assignee = ref('')
    const isSequential = ref(false)
    const loopCardinality = ref('')
    const collection = ref('')
    const elementVariable = ref('')
    const completionCondition = ref('')
    const completionType = ref<'all' | 'any' | 'quantity' | 'percentage' | 'advanced'>('all')
    const completionValue = ref<number | null>(null)
    const asyncBefore = ref(false)
    const asyncAfter = ref(false)
    const exclusive = ref(true)
    const retryTimeCycle = ref('')

    const candidateUsers = ref('')
    const candidateGroups = ref('')
    const dueDate = ref('')
    const followUpDate = ref('')
    const priority = ref<number | null>(null)

    const showJobExecution = computed(() => asyncBefore.value || asyncAfter.value)

    const sequentialOptions = [
      { label: t('bpmnPanel.multiInstance.parallel'), value: 'false' },
      { label: t('bpmnPanel.multiInstance.sequential'), value: 'true' },
    ]

    function getLoopCharacteristics(): any {
      const bo = props.businessObject
      if (!bo) return null
      const lc = bo.loopCharacteristics
      if (lc && lc.$type === 'bpmn:MultiInstanceLoopCharacteristics') return lc
      return null
    }

    function getOrCreateExtensionElements(): any {
      const bo = props.businessObject
      if (!bo || !props.bpmnModeler) return null
      const moddle = props.bpmnModeler.get('moddle')
      if (!bo.extensionElements) {
        bo.extensionElements = moddle.create('bpmn:ExtensionElements', { values: [] })
      }
      return bo.extensionElements
    }

    function findPropertiesContainer(ee: any): any {
      if (!ee?.values) return null
      return ee.values.find((v: any) => v.$type === 'camunda:Properties') || null
    }

    function readPermissions() {
      const bo = props.businessObject
      if (!bo) return
      const ee = bo.extensionElements
      if (!ee) return
      const container = findPropertiesContainer(ee)
      if (!container?.values) return
      const map = new Map<string, string>()
      for (const p of container.values) {
        if (p.name && p.value) map.set(p.name, p.value)
      }
      allowAddSign.value = map.get('allowAddSign') === 'true'
      allowTransfer.value = map.get('allowTransfer') === 'true'
      allowDelegate.value = map.get('allowDelegate') === 'true'
      allowReject.value = map.get('allowReject') === 'true'
      allowCopy.value = map.get('allowCopy') === 'true'
    }

    function writePermissions() {
      if (!props.bpmnModeler || !props.element) return
      const moddle = props.bpmnModeler.get('moddle')
      const bo = props.businessObject
      if (!bo) return
      const ee = getOrCreateExtensionElements()
      if (!ee) return
      let container = findPropertiesContainer(ee)
      if (!container) {
        container = moddle.create('camunda:Properties')
        ee.get('values').push(container)
      }
      const entries: [string, boolean][] = [
        ['allowAddSign', allowAddSign.value],
        ['allowTransfer', allowTransfer.value],
        ['allowDelegate', allowDelegate.value],
        ['allowReject', allowReject.value],
        ['allowCopy', allowCopy.value],
      ]
      const values = entries.map(([name, val]) =>
        moddle.create('camunda:Property', { name, value: val ? 'true' : 'false' }),
      )
      container.values = values
      const modeling = props.bpmnModeler.get('modeling')
      modeling.updateProperties(toRaw(props.element), {
        extensionElements: bo.extensionElements,
      })
    }

    function toTimestamp(iso: string): number | null {
      if (!iso || iso.startsWith('${')) return null
      const d = new Date(iso)
      return isNaN(d.getTime()) ? null : d.getTime()
    }

    function toIsoString(ts: number | null): string {
      if (ts == null) return ''
      const d = new Date(ts)
      return d.toISOString().replace(/\.\d{3}Z$/, '')
    }

    function syncFromModel() {
      const bo = props.businessObject
      if (!bo) return

      assignee.value = bo.assignee || ''
      candidateUsers.value = bo.candidateUsers || ''
      candidateGroups.value = bo.candidateGroups || ''
      dueDate.value = bo.dueDate || ''
      followUpDate.value = bo.followUpDate || ''
      priority.value = bo.priority ?? null

      readPermissions()

      const lc = getLoopCharacteristics()
      enabled.value = !!lc
      if (lc) {
        isSequential.value = lc.isSequential === true
        loopCardinality.value = lc.loopCardinality?.body || ''
        collection.value = lc.collection || ''
        elementVariable.value = lc.elementVariable || ''
        const body = lc.completionCondition?.body || ''
        completionCondition.value = body
        const anyMatch = body.match(/^\$\{nrOfCompletedInstances\s*>=\s*1\}$/)
        const qtyMatch = body.match(/^\$\{nrOfCompletedInstances\s*>=\s*(\d+)\}$/)
        const pctMatch = body.match(/^\$\{nrOfCompletedInstances\s*>=\s*nrOfInstances\s*\*\s*(\d+)\s*\/\s*100\}$/)
        if (anyMatch) {
          completionType.value = 'any'
          completionValue.value = null
        } else if (qtyMatch) {
          completionType.value = 'quantity'
          completionValue.value = Number(qtyMatch[1])
        } else if (pctMatch) {
          completionType.value = 'percentage'
          completionValue.value = Number(pctMatch[1])
        } else if (body) {
          completionType.value = 'advanced'
          completionValue.value = null
        } else {
          completionType.value = 'all'
          completionValue.value = null
        }

        const col = lc.collection || ''
        if (!isSequential.value && !anyMatch && !body) {
          executionMode.value = 'countersign'
        } else if (!isSequential.value && anyMatch) {
          executionMode.value = 'orsign'
        } else if (isSequential.value && !body) {
          executionMode.value = 'sequential'
        } else {
          executionMode.value = 'countersign'
        }

        const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const userRe = new RegExp(`^\\$\\{${escapeRe(props.userResolver)}\\((.+)\\)\\}$`)
        const groupRe = new RegExp(`^\\$\\{${escapeRe(props.groupResolver)}\\((.+)\\)\\}$`)
        const formFieldRe = /^\$\{formField\.(.+)\}$/
        const userMatch = col.match(userRe)
        const groupMatch = col.match(groupRe)
        const formFieldMatch = col.match(formFieldRe)
        const exprMatch = !userMatch && !groupMatch && !formFieldMatch && col.startsWith('${') && col.endsWith('}')
        if (userMatch) {
          approverMode.value = 'user'
          approverValue.value = userMatch[1] ?? ''
        } else if (groupMatch) {
          approverMode.value = 'group'
          approverValue.value = groupMatch[1] ?? ''
        } else if (formFieldMatch) {
          approverMode.value = 'formField'
          approverValue.value = formFieldMatch[1] ?? ''
        } else if (exprMatch) {
          approverMode.value = 'variable'
          approverValue.value = col.slice(2, -1)
        } else {
          approverMode.value = 'variable'
          approverValue.value = col || ''
        }

        asyncBefore.value = lc.asyncBefore === true
        asyncAfter.value = lc.asyncAfter === true
        exclusive.value = lc.exclusive !== false
        const lcExtValues = lc.extensionElements?.values || []
        const lcRetryCycle = lcExtValues.find((v: any) => v.$type === 'camunda:FailedJobRetryTimeCycle')
        retryTimeCycle.value = lcRetryCycle?.body ?? ''
      } else {
        isSequential.value = false
        loopCardinality.value = ''
        collection.value = ''
        elementVariable.value = ''
        completionCondition.value = ''
        completionType.value = 'all'
        completionValue.value = null
        executionMode.value = 'countersign'
        approverMode.value = 'variable'
        approverValue.value = ''
        asyncBefore.value = false
        asyncAfter.value = false
        exclusive.value = true
        retryTimeCycle.value = ''
      }
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function saveProperties(attrs: Record<string, any>) {
      if (!props.bpmnModeler || !props.element) return
      const modeling = props.bpmnModeler.get('modeling')
      modeling.updateProperties(toRaw(props.element), attrs)
    }

    function updateProperty(key: string, value: any) {
      if (!props.bpmnModeler || !props.element) return
      const modeling = props.bpmnModeler.get('modeling')
      modeling.updateProperties(toRaw(props.element), { [key]: value })
    }

    function removeLcAttribute(key: string) {
      const lc = getLoopCharacteristics()
      if (!lc || !props.bpmnModeler) return
      delete lc[key]
      const modeling = props.bpmnModeler.get('modeling')
      modeling.updateProperties(toRaw(props.element), { loopCharacteristics: lc })
    }

    function updateLcRetryTimeCycle(val: string | null) {
      const lc = getLoopCharacteristics()
      if (!lc || !props.bpmnModeler) return
      const moddle = props.bpmnModeler.get('moddle')
      if (!lc.extensionElements) {
        lc.extensionElements = moddle.create('bpmn:ExtensionElements', { values: [] })
      }
      const ee = lc.extensionElements
      let retry = ee.values.find((r: any) => r.$type === 'camunda:FailedJobRetryTimeCycle')
      if (val) {
        if (!retry) {
          retry = moddle.create('camunda:FailedJobRetryTimeCycle', { body: val })
          ee.get('values').push(retry)
        } else {
          retry.body = val
        }
      } else if (retry) {
        ee.values = ee.values.filter((r: any) => r !== retry)
      }
      const modeling = props.bpmnModeler.get('modeling')
      modeling.updateProperties(toRaw(props.element), { loopCharacteristics: lc })
    }

    function updateCollection(val: string) {
      const lc = getLoopCharacteristics()
      if (!lc) return
      lc.collection = val || undefined
      const modeling = props.bpmnModeler.get('modeling')
      modeling.updateProperties(toRaw(props.element), { loopCharacteristics: lc })
    }

    function updateElementVariable(val: string) {
      const lc = getLoopCharacteristics()
      if (!lc) return
      lc.elementVariable = val || undefined
      const modeling = props.bpmnModeler.get('modeling')
      modeling.updateProperties(toRaw(props.element), { loopCharacteristics: lc })
    }

    function setCompletionBody(body: string) {
      completionCondition.value = body
      if (!props.bpmnModeler || !props.element) return
      const lc = getLoopCharacteristics()
      if (!lc) return
      const moddle = props.bpmnModeler.get('moddle')
      if (body) {
        if (!lc.completionCondition) {
          lc.completionCondition = moddle.create('bpmn:FormalExpression', { body })
        } else {
          lc.completionCondition.body = body
        }
      } else {
        lc.completionCondition = undefined
      }
      const modeling = props.bpmnModeler.get('modeling')
      modeling.updateProperties(toRaw(props.element), { loopCharacteristics: lc })
    }

    function onEnabledChange(val: boolean) {
      enabled.value = val
      if (!props.bpmnModeler || !props.element) return
      const moddle = props.bpmnModeler.get('moddle')
      const bo = props.businessObject
      if (!bo) return
      if (val) {
        const isSeq = executionMode.value === 'sequential'
        const lc = moddle.create('bpmn:MultiInstanceLoopCharacteristics', {
          isSequential: isSeq,
        })
        const ev = elementVariable.value || 'item'
        lc.elementVariable = ev
        if (executionMode.value === 'orsign') {
          lc.completionCondition = moddle.create('bpmn:FormalExpression', {
            body: '${nrOfCompletedInstances >= 1}',
          })
        }
        if (collection.value) lc.collection = collection.value
        if (loopCardinality.value) {
          lc.loopCardinality = moddle.create('bpmn:FormalExpression', {
            body: loopCardinality.value,
          })
        }
        if (completionCondition.value && !lc.completionCondition) {
          lc.completionCondition = moddle.create('bpmn:FormalExpression', {
            body: completionCondition.value,
          })
        }
        if (asyncBefore.value) lc.asyncBefore = true
        if (asyncAfter.value) lc.asyncAfter = true
        if (!exclusive.value) lc.exclusive = false
        if (retryTimeCycle.value) {
          if (!lc.extensionElements) {
            lc.extensionElements = moddle.create('bpmn:ExtensionElements', { values: [] })
          }
          const retry = moddle.create('camunda:FailedJobRetryTimeCycle', { body: retryTimeCycle.value })
          lc.extensionElements.get('values').push(retry)
        }
        saveProperties({
          loopCharacteristics: lc,
          assignee: `\${${ev}}`,
        })
        assignee.value = `\${${ev}}`
      } else {
        saveProperties({
          loopCharacteristics: undefined,
          assignee: '',
        })
        assignee.value = ''
      }
    }

    function onPanelModeChange(val: 'normal' | 'advanced') {
      panelMode.value = val
    }

    function onExecutionModeChange(val: 'countersign' | 'orsign' | 'sequential') {
      executionMode.value = val
      const lc = getLoopCharacteristics()
      if (!lc) return
      if (val === 'sequential') {
        lc.isSequential = true
        setCompletionBody('')
      } else {
        lc.isSequential = false
        if (val === 'orsign') {
          setCompletionBody('${nrOfCompletedInstances >= 1}')
        } else {
          setCompletionBody('')
        }
      }
      saveProperties({ loopCharacteristics: lc })
    }

    function onApproverModeChange(val: 'variable' | 'user' | 'group' | 'formField') {
      approverMode.value = val
      approverValue.value = ''
      collection.value = ''
      updateCollection('')
    }

    function onApproverValueChange(val: string | null) {
      const raw = val ?? ''
      approverValue.value = raw
      const expr = raw ? `\${${raw}}` : ''
      collection.value = expr
      updateCollection(expr)
      if (expr && !elementVariable.value) {
        elementVariable.value = 'item'
        updateElementVariable('item')
      }
    }

    function onApproverUserPickerChange(val: string | null) {
      const raw = val ?? ''
      approverValue.value = raw
      const expr = raw ? `\${${props.userResolver}(${raw})}` : ''
      collection.value = expr
      updateCollection(expr)
      candidateUsers.value = raw
      updateProperty('candidateUsers', raw)
      if (expr && !elementVariable.value) {
        elementVariable.value = 'item'
        updateElementVariable('item')
      }
    }

    function onApproverGroupPickerChange(val: string | null) {
      const raw = val ?? ''
      approverValue.value = raw
      const expr = raw ? `\${${props.groupResolver}(${raw})}` : ''
      collection.value = expr
      updateCollection(expr)
      candidateGroups.value = raw
      updateProperty('candidateGroups', raw)
      if (expr && !elementVariable.value) {
        elementVariable.value = 'item'
        updateElementVariable('item')
      }
    }

    function onPermissionChange(key: string, val: boolean) {
      switch (key) {
        case 'allowAddSign': allowAddSign.value = val; break
        case 'allowTransfer': allowTransfer.value = val; break
        case 'allowDelegate': allowDelegate.value = val; break
        case 'allowReject': allowReject.value = val; break
        case 'allowCopy': allowCopy.value = val; break
      }
      writePermissions()
    }

    function onCandidateUsersChange(val: string) {
      candidateUsers.value = val
      updateProperty('candidateUsers', val)
    }

    function onCandidateGroupsChange(val: string | null) {
      candidateGroups.value = val ?? ''
      updateProperty('candidateGroups', val ?? '')
    }

    function onDueDateChange(val: string | null) {
      dueDate.value = val ?? ''
      updateProperty('dueDate', val ?? '')
    }

    function onFollowUpDateChange(val: string | null) {
      followUpDate.value = val ?? ''
      updateProperty('followUpDate', val ?? '')
    }

    function onPriorityChange(val: number | null) {
      priority.value = val
      updateProperty('priority', val)
    }

    function onAssigneeChange(val: string) {
      assignee.value = val
      updateProperty('assignee', val)
    }

    function onSequentialChange(val: boolean) {
      isSequential.value = val
      const lc = getLoopCharacteristics()
      if (!lc) return
      lc.isSequential = val
      saveProperties({ loopCharacteristics: lc })
    }

    function onLoopCardinalityChange(val: string | null) {
      loopCardinality.value = val ?? ''
      if (!props.bpmnModeler || !props.element) return
      const lc = getLoopCharacteristics()
      if (!lc) return
      const moddle = props.bpmnModeler.get('moddle')
      if (val) {
        if (!lc.loopCardinality) {
          lc.loopCardinality = moddle.create('bpmn:FormalExpression', { body: val })
        } else {
          lc.loopCardinality.body = val
        }
      } else {
        lc.loopCardinality = undefined
      }
      const modeling = props.bpmnModeler.get('modeling')
      modeling.updateProperties(toRaw(props.element), { loopCharacteristics: lc })
    }

    function onCollectionChange(val: string | null) {
      collection.value = val ?? ''
      const lc = getLoopCharacteristics()
      if (!lc) return
      lc.collection = val || undefined
      const modeling = props.bpmnModeler.get('modeling')
      modeling.updateProperties(toRaw(props.element), { loopCharacteristics: lc })
    }

    function onElementVariableChange(val: string | null) {
      const raw = val ?? ''
      elementVariable.value = raw
      const lc = getLoopCharacteristics()
      if (!lc) return
      lc.elementVariable = raw || undefined
      const modeling = props.bpmnModeler.get('modeling')
      modeling.updateProperties(toRaw(props.element), { loopCharacteristics: lc })
      if (enabled.value) {
        const newAssignee = raw ? `\${${raw}}` : ''
        assignee.value = newAssignee
        updateProperty('assignee', newAssignee)
      }
    }

    function onCompletionTypeChange(val: 'all' | 'any' | 'quantity' | 'percentage' | 'advanced') {
      completionType.value = val
      switch (val) {
        case 'all':
          completionValue.value = null
          setCompletionBody('')
          break
        case 'any':
          completionValue.value = null
          setCompletionBody('${nrOfCompletedInstances >= 1}')
          break
        case 'quantity':
          if (completionValue.value != null) {
            setCompletionBody(`\${nrOfCompletedInstances >= ${completionValue.value}}`)
          } else {
            setCompletionBody('')
          }
          break
        case 'percentage':
          if (completionValue.value != null) {
            setCompletionBody(`\${nrOfCompletedInstances >= nrOfInstances * ${completionValue.value} / 100}`)
          } else {
            setCompletionBody('')
          }
          break
        case 'advanced':
          completionValue.value = null
          break
      }
    }

    function onCompletionValueChange(val: number | null) {
      completionValue.value = val
      if (val == null) return
      if (completionType.value === 'quantity') {
        setCompletionBody(`\${nrOfCompletedInstances >= ${val}}`)
      } else if (completionType.value === 'percentage') {
        setCompletionBody(`\${nrOfCompletedInstances >= nrOfInstances * ${val} / 100}`)
      }
    }

    function onCompletionAdvancedChange(val: string | null) {
      setCompletionBody(val ?? '')
    }

    function renderBottomDateFields() {
      return (
        <div class="flex flex-col gap-12px">
          <div>
            <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.dueDate')}</div>
            <NDatePicker
              value={toTimestamp(dueDate.value)}
              onUpdateValue={(v: number | null) => onDueDateChange(toIsoString(v))}
              type="datetime"
              size={props.formSize}
              style="width:100%"
              clearable
            />
          </div>
          <div>
            <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.followUpDate')}</div>
            <NDatePicker
              value={toTimestamp(followUpDate.value)}
              onUpdateValue={(v: number | null) => onFollowUpDateChange(toIsoString(v))}
              type="datetime"
              size={props.formSize}
              style="width:100%"
              clearable
            />
          </div>
          <div>
            <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.priority')}</div>
            <NInputNumber
              value={priority.value}
              onUpdateValue={onPriorityChange}
              placeholder={t('bpmnPanel.placeholders.priority')}
              size={props.formSize}
              min={0}
              class="w-full"
            />
          </div>
        </div>
      )
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

      if (props.tabName === 'taskListeners') {
        return (
          <div class="pt-8px">
            <TaskListenersPanel
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
          <div class="flex items-center justify-between mb-8px">
            <NCheckbox
              checked={enabled.value}
              onUpdateChecked={onEnabledChange}
              size={props.formSize === 'small' ? 'small' : 'medium'}
            >
              {t('bpmnPanel.userTask.multiApproval')}
            </NCheckbox>
            <NRadioGroup
              value={panelMode.value}
              onUpdateValue={onPanelModeChange}
              size={props.formSize}
            >
              <NRadioButton value="normal">{t('bpmnPanel.multiInstance.normal')}</NRadioButton>
              <NRadioButton value="advanced">{t('bpmnPanel.multiInstance.advanced')}</NRadioButton>
            </NRadioGroup>
          </div>

          {!enabled.value && panelMode.value === 'normal' && (
            <div class="flex flex-col gap-12px">
              <UserPicker
                value={candidateUsers.value}
                onUpdate:value={onCandidateUsersChange}
                multiple
                formSize={props.formSize}
                label={t('bpmnPanel.fields.candidateUsers')}
                placeholder={t('bpmnPanel.placeholders.candidateUsers')}
              />
              <GroupPicker
                value={candidateGroups.value}
                onUpdate:value={onCandidateGroupsChange}
                multiple
                formSize={props.formSize}
                label={t('bpmnPanel.fields.candidateGroups')}
                placeholder={t('bpmnPanel.placeholders.candidateGroups')}
              />
              <div class="border-t border-#eee dark:border-#333 pt-12px" />
              {renderBottomDateFields()}
            </div>
          )}

          {!enabled.value && panelMode.value === 'advanced' && (
            <div class="flex flex-col gap-12px">
              <UserPicker
                value={assignee.value}
                onUpdate:value={onAssigneeChange}
                multiple={false}
                formSize={props.formSize}
                label={t('bpmnPanel.fields.assignee')}
                placeholder={t('bpmnPanel.placeholders.assignee')}
              />
              <UserPicker
                value={candidateUsers.value}
                onUpdate:value={onCandidateUsersChange}
                multiple
                formSize={props.formSize}
                label={t('bpmnPanel.fields.candidateUsers')}
                placeholder={t('bpmnPanel.placeholders.candidateUsers')}
              />
              <GroupPicker
                value={candidateGroups.value}
                onUpdate:value={onCandidateGroupsChange}
                multiple
                formSize={props.formSize}
                label={t('bpmnPanel.fields.candidateGroups')}
                placeholder={t('bpmnPanel.placeholders.candidateGroups')}
              />
              <div class="border-t border-#eee dark:border-#333 pt-12px" />
              {renderBottomDateFields()}
            </div>
          )}

          {enabled.value && panelMode.value === 'normal' && (
            <div class="flex flex-col gap-12px">
              <div class="border-t border-#eee dark:border-#333 pt-12px">
                <div class="mb-4px text-12px text-#666">
                  {t('bpmnPanel.multiInstance.executionMode')}
                </div>
                <NRadioGroup
                  value={executionMode.value}
                  onUpdateValue={onExecutionModeChange}
                  size={props.formSize}
                >
                  <div class="flex flex-col gap-4px">
                    <NRadio value="countersign">{t('bpmnPanel.multiInstance.countersign')}</NRadio>
                    <NRadio value="orsign">{t('bpmnPanel.multiInstance.orsign')}</NRadio>
                    <NRadio value="sequential">{t('bpmnPanel.multiInstance.sequentialSign')}</NRadio>
                  </div>
                </NRadioGroup>
              </div>

              <div class="border-t border-#eee dark:border-#333 pt-12px">
                <div class="mb-4px text-12px text-#666">
                  {t('bpmnPanel.multiInstance.approverSource')}
                </div>
                <NRadioGroup
                  value={approverMode.value}
                  onUpdateValue={onApproverModeChange}
                  size={props.formSize}
                >
                  <NRadioButton value="variable">{t('bpmnPanel.multiInstance.approverVariable')}</NRadioButton>
                  <NRadioButton value="user">{t('bpmnPanel.multiInstance.approverUser')}</NRadioButton>
                  <NRadioButton value="group">{t('bpmnPanel.multiInstance.approverGroup')}</NRadioButton>
                  <NRadioButton value="formField">{t('bpmnPanel.multiInstance.approverFormField')}</NRadioButton>
                </NRadioGroup>
                <div class="mt-8px">
                  {approverMode.value === 'variable' && (
                    <NInput
                      value={approverValue.value}
                      onUpdateValue={onApproverValueChange}
                      placeholder={t('bpmnPanel.multiInstance.approverVariablePlaceholder')}
                      size={props.formSize}
                    />
                  )}
                  {approverMode.value === 'user' && (
                    <UserPicker
                      value={approverValue.value}
                      onUpdate:value={onApproverUserPickerChange}
                      formSize={props.formSize}
                      allowExpression={false}
                    />
                  )}
                  {approverMode.value === 'group' && (
                    <GroupPicker
                      value={approverValue.value}
                      onUpdate:value={onApproverGroupPickerChange}
                      formSize={props.formSize}
                      allowExpression={false}
                    />
                  )}
                  {approverMode.value === 'formField' && (
                    <NInput
                      value={approverValue.value}
                      onUpdateValue={onApproverValueChange}
                      placeholder={t('bpmnPanel.multiInstance.approverFormFieldPlaceholder')}
                      size={props.formSize}
                    />
                  )}
                  {collection.value && (
                    <div class="mt-4px text-11px text-#999">
                      <code class="bg-#f5f5f5 dark:bg-#333 px-6px py-2px rounded-4px">{collection.value}</code>
                    </div>
                  )}
                </div>
              </div>

              {(executionMode.value === 'countersign' || executionMode.value === 'sequential') && (
                <div class="border-t border-#eee dark:border-#333 pt-12px">
                  <div class="mb-4px text-12px text-#666 flex items-center gap-4px">
                    <span>{t('bpmnPanel.multiInstance.completionCondition')}</span>
                  </div>
                  <NRadioGroup
                    value={completionType.value}
                    onUpdateValue={onCompletionTypeChange}
                    size={props.formSize}
                  >
                    <div class="flex flex-col gap-4px w-full">
                      <NRadio size={props.formSize} value="all">{t('bpmnPanel.multiInstance.completionAll')}</NRadio>
                      {executionMode.value !== 'countersign' && (
                        <NRadio size={props.formSize} value="any">{t('bpmnPanel.multiInstance.completionAny')}</NRadio>
                      )}
                      <div class="grid grid-cols-[auto_auto_1fr] items-center gap-4px w-full">
                        <NRadio size={props.formSize} value="quantity" >{t('bpmnPanel.multiInstance.completionQuantity')}</NRadio>
                        {completionType.value === 'quantity' && (
                          <NInputNumber
                            value={completionValue.value}
                            onUpdateValue={onCompletionValueChange}
                            size={props.formSize}
                            style="width:100%"
                            min={1}
                            placeholder="0"
                          />
                        )}
                      </div>
                      <div class="grid grid-cols-[auto_auto_1fr] items-center gap-4px w-full">
                        <NRadio size={props.formSize} value="percentage" >{t('bpmnPanel.multiInstance.completionPercentage')}</NRadio>
                        {completionType.value === 'percentage' && (
                          <div class="flex items-center gap-2px" style="width:100%">
                            <NInputNumber
                              value={completionValue.value}
                              onUpdateValue={onCompletionValueChange}
                              size={props.formSize}
                              style="width:100%"
                              min={1}
                              max={100}
                              placeholder="0"
                            />
                            <span class="text-12px text-#666 flex-shrink-0">%</span>
                          </div>
                        )}
                      </div>
                      <div class="grid grid-cols-[auto_auto_1fr] items-center gap-4px w-full">
                        <NRadio size={props.formSize} value="advanced" />
                        <span class="text-12px flex-shrink-0">{t('bpmnPanel.multiInstance.completionAdvanced')}</span>
                        {completionType.value === 'advanced' && (
                          <NInput
                            value={completionCondition.value}
                            onUpdateValue={onCompletionAdvancedChange}
                            placeholder={t('bpmnPanel.placeholders.completionCondition')}
                            size={props.formSize}
                            style="width:100%"
                          />
                        )}
                      </div>
                    </div>
                  </NRadioGroup>
                </div>
              )}

              <div class="border-t border-#eee dark:border-#333 pt-12px">
                <div class="mb-4px text-12px text-#666">
                  {t('bpmnPanel.multiInstance.permissions')}
                </div>
                <div class="flex flex-wrap gap-x-16px gap-y-4px">
                  <NCheckbox
                    checked={allowAddSign.value}
                    onUpdateChecked={(v: boolean) => onPermissionChange('allowAddSign', v)}
                    size={props.formSize === 'small' ? 'small' : 'medium'}
                  >
                    {t('bpmnPanel.multiInstance.allowAddSign')}
                  </NCheckbox>
                  <NCheckbox
                    checked={allowTransfer.value}
                    onUpdateChecked={(v: boolean) => onPermissionChange('allowTransfer', v)}
                    size={props.formSize === 'small' ? 'small' : 'medium'}
                  >
                    {t('bpmnPanel.multiInstance.allowTransfer')}
                  </NCheckbox>
                  <NCheckbox
                    checked={allowDelegate.value}
                    onUpdateChecked={(v: boolean) => onPermissionChange('allowDelegate', v)}
                    size={props.formSize === 'small' ? 'small' : 'medium'}
                  >
                    {t('bpmnPanel.multiInstance.allowDelegate')}
                  </NCheckbox>
                  <NCheckbox
                    checked={allowReject.value}
                    onUpdateChecked={(v: boolean) => onPermissionChange('allowReject', v)}
                    size={props.formSize === 'small' ? 'small' : 'medium'}
                  >
                    {t('bpmnPanel.multiInstance.allowReject')}
                  </NCheckbox>
                  <NCheckbox
                    checked={allowCopy.value}
                    onUpdateChecked={(v: boolean) => onPermissionChange('allowCopy', v)}
                    size={props.formSize === 'small' ? 'small' : 'medium'}
                  >
                    {t('bpmnPanel.multiInstance.allowCopy')}
                  </NCheckbox>
                </div>
              </div>

              {renderBottomDateFields()}
            </div>
          )}

          {enabled.value && panelMode.value === 'advanced' && (
            <div class="flex flex-col gap-12px">
              <UserPicker
                value={assignee.value}
                onUpdate:value={onAssigneeChange}
                multiple={false}
                formSize={props.formSize}
                label={t('bpmnPanel.fields.assignee')}
                placeholder={t('bpmnPanel.placeholders.assignee')}
              />
              <UserPicker
                value={candidateUsers.value}
                onUpdate:value={onCandidateUsersChange}
                multiple
                formSize={props.formSize}
                label={t('bpmnPanel.fields.candidateUsers')}
                placeholder={t('bpmnPanel.placeholders.candidateUsers')}
              />
              <GroupPicker
                value={candidateGroups.value}
                onUpdate:value={onCandidateGroupsChange}
                multiple
                formSize={props.formSize}
                label={t('bpmnPanel.fields.candidateGroups')}
                placeholder={t('bpmnPanel.placeholders.candidateGroups')}
              />
              <div class="border-t border-#eee dark:border-#333 pt-12px" />
              <div class="border-t border-#eee dark:border-#333 pt-12px">
                <div class="mb-4px text-12px text-#666">{t('bpmnPanel.multiInstance.type')}</div>
                <NSelect
                  value={isSequential.value ? 'true' : 'false'}
                  onUpdateValue={(v: string | null) => onSequentialChange(v === 'true')}
                  options={sequentialOptions}
                  size={props.formSize}
                />
              </div>
              <div>
                <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.loopCardinality')}</div>
                <NInput
                  value={loopCardinality.value}
                  onUpdateValue={onLoopCardinalityChange}
                  placeholder={t('bpmnPanel.placeholders.loopCardinality')}
                  size={props.formSize}
                />
              </div>
              <div class="border-t border-#eee dark:border-#333 pt-12px">
                <div class="mb-4px text-12px text-#666">
                  {t('bpmnPanel.fields.collection')}
                </div>
                <NRadioGroup
                  value={approverMode.value}
                  onUpdateValue={onApproverModeChange}
                  size={props.formSize}
                >
                  <NRadioButton value="variable">{t('bpmnPanel.multiInstance.approverVariable')}</NRadioButton>
                  <NRadioButton value="user">{t('bpmnPanel.multiInstance.approverUser')}</NRadioButton>
                  <NRadioButton value="group">{t('bpmnPanel.multiInstance.approverGroup')}</NRadioButton>
                  <NRadioButton value="formField">{t('bpmnPanel.multiInstance.approverFormField')}</NRadioButton>
                </NRadioGroup>
                <div class="mt-8px">
                  {approverMode.value === 'variable' && (
                    <NInput
                      value={approverValue.value}
                      onUpdateValue={onApproverValueChange}
                      placeholder={t('bpmnPanel.multiInstance.approverVariablePlaceholder')}
                      size={props.formSize}
                    />
                  )}
                  {approverMode.value === 'user' && (
                    <UserPicker
                      value={approverValue.value}
                      onUpdate:value={onApproverUserPickerChange}
                      formSize={props.formSize}
                      allowExpression={false}
                    />
                  )}
                  {approverMode.value === 'group' && (
                    <GroupPicker
                      value={approverValue.value}
                      onUpdate:value={onApproverGroupPickerChange}
                      formSize={props.formSize}
                      allowExpression={false}
                    />
                  )}
                  {approverMode.value === 'formField' && (
                    <NInput
                      value={approverValue.value}
                      onUpdateValue={onApproverValueChange}
                      placeholder={t('bpmnPanel.multiInstance.approverFormFieldPlaceholder')}
                      size={props.formSize}
                    />
                  )}
                  {collection.value && (
                    <div class="mt-4px text-11px text-#999">
                      <code class="bg-#f5f5f5 dark:bg-#333 px-6px py-2px rounded-4px">{collection.value}</code>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.elementVariable')}</div>
                <NInput
                  value={elementVariable.value}
                  onUpdateValue={onElementVariableChange}
                  placeholder={t('bpmnPanel.placeholders.elementVariable')}
                  size={props.formSize}
                />
              </div>
              {(executionMode.value === 'countersign' || executionMode.value === 'sequential') && (
                <div>
                  <div class="mb-4px text-12px text-#666 flex items-center gap-4px">
                    <span>{t('bpmnPanel.multiInstance.completionCondition')}</span>
                  </div>
                  <NRadioGroup
                    value={completionType.value}
                    onUpdateValue={onCompletionTypeChange}
                    size={props.formSize}
                  >
                    <div class="flex flex-col gap-4px w-full">
                      <NRadio size={props.formSize} value="all">{t('bpmnPanel.multiInstance.completionAll')}</NRadio>
                      {executionMode.value !== 'countersign' && (
                        <NRadio size={props.formSize} value="any">{t('bpmnPanel.multiInstance.completionAny')}</NRadio>
                      )}
                      <div class="grid grid-cols-[auto_auto_1fr] items-center gap-4px w-full">
                        <NRadio size={props.formSize} value="quantity" />
                        <span class="text-12px flex-shrink-0">{t('bpmnPanel.multiInstance.completionQuantity')}</span>
                        {completionType.value === 'quantity' && (
                          <NInputNumber
                            value={completionValue.value}
                            onUpdateValue={onCompletionValueChange}
                            size={props.formSize}
                            style="width:100%"
                            min={1}
                            placeholder="0"
                          />
                        )}
                      </div>
                      <div class="grid grid-cols-[auto_auto_1fr] items-center gap-4px w-full">
                        <NRadio size={props.formSize} value="percentage" />
                        <span class="text-12px flex-shrink-0">{t('bpmnPanel.multiInstance.completionPercentage')}</span>
                        {completionType.value === 'percentage' && (
                          <div class="flex items-center gap-2px" style="width:100%">
                            <NInputNumber
                              value={completionValue.value}
                              onUpdateValue={onCompletionValueChange}
                              size={props.formSize}
                              style="width:100%"
                              min={1}
                              max={100}
                              placeholder="0"
                            />
                            <span class="text-12px text-#666 flex-shrink-0">%</span>
                          </div>
                        )}
                      </div>
                      <div class="grid grid-cols-[auto_auto_1fr] items-center gap-4px w-full">
                        <NRadio size={props.formSize} value="advanced" />
                        <span class="text-12px flex-shrink-0">{t('bpmnPanel.multiInstance.completionAdvanced')}</span>
                        {completionType.value === 'advanced' && (
                          <NInput
                            value={completionCondition.value}
                            onUpdateValue={onCompletionAdvancedChange}
                            placeholder={t('bpmnPanel.placeholders.completionCondition')}
                            size={props.formSize}
                            style="width:100%"
                          />
                        )}
                      </div>
                    </div>
                  </NRadioGroup>
                </div>
              )}
              <div class="border-t border-#eee dark:border-#333 pt-12px">
                <div class="mb-4px text-12px text-#666">
                  {t('bpmnPanel.multiInstance.permissions')}
                </div>
                <div class="flex flex-wrap gap-x-16px gap-y-4px">
                  <NCheckbox
                    checked={allowAddSign.value}
                    onUpdateChecked={(v: boolean) => onPermissionChange('allowAddSign', v)}
                    size={props.formSize === 'small' ? 'small' : 'medium'}
                  >
                    {t('bpmnPanel.multiInstance.allowAddSign')}
                  </NCheckbox>
                  <NCheckbox
                    checked={allowTransfer.value}
                    onUpdateChecked={(v: boolean) => onPermissionChange('allowTransfer', v)}
                    size={props.formSize === 'small' ? 'small' : 'medium'}
                  >
                    {t('bpmnPanel.multiInstance.allowTransfer')}
                  </NCheckbox>
                  <NCheckbox
                    checked={allowDelegate.value}
                    onUpdateChecked={(v: boolean) => onPermissionChange('allowDelegate', v)}
                    size={props.formSize === 'small' ? 'small' : 'medium'}
                  >
                    {t('bpmnPanel.multiInstance.allowDelegate')}
                  </NCheckbox>
                  <NCheckbox
                    checked={allowReject.value}
                    onUpdateChecked={(v: boolean) => onPermissionChange('allowReject', v)}
                    size={props.formSize === 'small' ? 'small' : 'medium'}
                  >
                    {t('bpmnPanel.multiInstance.allowReject')}
                  </NCheckbox>
                  <NCheckbox
                    checked={allowCopy.value}
                    onUpdateChecked={(v: boolean) => onPermissionChange('allowCopy', v)}
                    size={props.formSize === 'small' ? 'small' : 'medium'}
                  >
                    {t('bpmnPanel.multiInstance.allowCopy')}
                  </NCheckbox>
                </div>
              </div>

              {renderBottomDateFields()}

              <div class="mb-4px mt-4px text-12px text-#666">
                {t('bpmnPanel.fields.asyncContinuousExecution')}
              </div>
              <div class="flex flex-row gap-8px">
                <NCheckbox
                  checked={asyncBefore.value}
                  onUpdateChecked={(v: boolean) => {
                    asyncBefore.value = v
                    const lc = getLoopCharacteristics()
                    if (!lc) return
                    if (v) lc.asyncBefore = true
                    else delete lc.asyncBefore
                    const modeling = props.bpmnModeler.get('modeling')
                    modeling.updateProperties(toRaw(props.element), { loopCharacteristics: lc })
                  }}
                  size={props.formSize === 'small' ? 'small' : 'medium'}
                >
                  {t('bpmnPanel.fields.asyncBefore')}
                </NCheckbox>
                <NCheckbox
                  checked={asyncAfter.value}
                  onUpdateChecked={(v: boolean) => {
                    asyncAfter.value = v
                    const lc = getLoopCharacteristics()
                    if (!lc) return
                    if (v) lc.asyncAfter = true
                    else delete lc.asyncAfter
                    const modeling = props.bpmnModeler.get('modeling')
                    modeling.updateProperties(toRaw(props.element), { loopCharacteristics: lc })
                  }}
                  size={props.formSize === 'small' ? 'small' : 'medium'}
                >
                  {t('bpmnPanel.fields.asyncAfter')}
                </NCheckbox>
                <NCheckbox
                  checked={exclusive.value}
                  onUpdateChecked={(v: boolean) => {
                    exclusive.value = v
                    const lc = getLoopCharacteristics()
                    if (!lc) return
                    if (!v) lc.exclusive = false
                    else delete lc.exclusive
                    const modeling = props.bpmnModeler.get('modeling')
                    modeling.updateProperties(toRaw(props.element), { loopCharacteristics: lc })
                  }}
                  size={props.formSize === 'small' ? 'small' : 'medium'}
                >
                  {t('bpmnPanel.fields.exclusive')}
                </NCheckbox>
              </div>
              {showJobExecution.value && (
                <div>
                  <div class="mb-4px text-12px">
                    <NTooltip trigger="hover" placement="top">
                      {{
                        trigger: () => (
                          <span class="border-b border-dashed border-#1890ff text-#1890ff cursor-help">
                            {t('bpmnPanel.fields.retryTimeCycle')}
                          </span>
                        ),
                        default: () => t('bpmnPanel.tooltips.retryTimeCycle'),
                      }}
                    </NTooltip>
                  </div>
                  <NInput
                    value={retryTimeCycle.value}
                    onUpdateValue={(v: string | null) => {
                      retryTimeCycle.value = v ?? ''
                      updateLcRetryTimeCycle(v)
                    }}
                    placeholder={t('bpmnPanel.placeholders.retryTimeCycle')}
                    size={props.formSize}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )
    }
  },
})
