import { defineComponent, ref, computed, watch, toRaw, type PropType } from 'vue'
import {
  NCheckbox, NInput, NSelect, NInputNumber, NTooltip, NRadioGroup, NRadioButton, NRadio,
} from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import UserPicker from './UserPicker'
import GroupPicker from './GroupPicker'


export default defineComponent({
  name: 'MultiInstanceFields',
  props: {
    businessObject: { type: Object as PropType<any>, default: null },
    element: { type: Object as PropType<any>, default: null },
    bpmnModeler: { type: Object, default: null },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
  },
  setup(props) {
    const { t } = useCamundaI18n()

    const enabled = ref(false)
    const isSequential = ref(false)
    const loopCardinality = ref('')
    const collection = ref('')
    const elementVariable = ref('')
    const completionCondition = ref('')
    const completionType = ref<'all' | 'any' | 'quantity' | 'percentage' | 'advanced'>('all')
    const completionValue = ref<number | null>(null)
    const asyncBefore = ref(false)
    const asyncAfter = ref(false)
    const exclusive = ref(false)
    const retryTimeCycle = ref('')
    const panelMode = ref<'normal' | 'advanced'>('normal')

    const normalCompletionType = ref<'all' | 'any' | 'quantity' | 'percentage'>('all')
    const normalCompletionValue = ref<number | null>(null)
    const approverMode = ref<'variable' | 'user' | 'group'>('variable')
    const approverValue = ref('')

    const showJobExecution = computed(() => asyncBefore.value || asyncAfter.value)

    const normalCompletionBody = computed(() => {
      switch (normalCompletionType.value) {
        case 'all':
          return ''
        case 'any':
          return '${nrOfCompletedInstances >= 1}'
        case 'quantity':
          return normalCompletionValue.value != null
            ? `\${nrOfCompletedInstances >= ${normalCompletionValue.value}}`
            : ''
        case 'percentage':
          return normalCompletionValue.value != null
            ? `\${nrOfCompletedInstances >= nrOfInstances * ${normalCompletionValue.value} / 100}`
            : ''
      }
    })

    const completionExpressionDisplay = computed(() => {
      switch (completionType.value) {
        case 'all':
          return ''
        case 'any':
          return '${nrOfCompletedInstances >= 1}'
        case 'quantity':
          return completionValue.value != null
            ? `\${nrOfCompletedInstances >= ${completionValue.value}}`
            : ''
        case 'percentage':
          return completionValue.value != null
            ? `\${nrOfCompletedInstances >= nrOfInstances * ${completionValue.value} / 100}`
            : ''
        case 'advanced':
          return completionCondition.value
      }
    })

    function getLoopCharacteristics(): any {
      const bo = props.businessObject
      if (!bo) return null
      const lc = bo.loopCharacteristics
      if (lc && lc.$type === 'bpmn:MultiInstanceLoopCharacteristics') return lc
      return null
    }

    function syncFromModel() {
      const lc = getLoopCharacteristics()
      enabled.value = !!lc
      if (lc) {
        isSequential.value = lc.isSequential === true
        loopCardinality.value = lc.loopCardinality?.body || ''
        const body = lc.completionCondition?.body || ''
        completionCondition.value = body
        const anyMatch = body.match(/^\$\{nrOfCompletedInstances\s*>=\s*1\}$/)
        const qtyMatch = body.match(/^\$\{nrOfCompletedInstances\s*>=\s*(\d+)\}$/)
        const pctMatch = body.match(/^\$\{nrOfCompletedInstances\s*>=\s*nrOfInstances\s*\*\s*(\d+)\s*\/\s*100\}$/)
        if (anyMatch) {
          completionType.value = 'any'
          normalCompletionType.value = 'any'
          completionValue.value = null
          normalCompletionValue.value = null
        } else if (qtyMatch) {
          completionType.value = 'quantity'
          normalCompletionType.value = 'quantity'
          completionValue.value = Number(qtyMatch[1])
          normalCompletionValue.value = Number(qtyMatch[1])
        } else if (pctMatch) {
          completionType.value = 'percentage'
          normalCompletionType.value = 'percentage'
          completionValue.value = Number(pctMatch[1])
          normalCompletionValue.value = Number(pctMatch[1])
        } else if (body) {
          completionType.value = 'advanced'
          normalCompletionType.value = 'all'
          completionValue.value = null
          normalCompletionValue.value = null
        } else {
          completionType.value = 'all'
          normalCompletionType.value = 'all'
          completionValue.value = null
          normalCompletionValue.value = null
        }
        const col = lc.collection || ''
        const ev = lc.elementVariable || ''
        collection.value = col
        elementVariable.value = ev
        const userMatch = col.match(/^\$\{approverResolver\.getUsers\((.+)\)\}$/)
        const groupMatch = col.match(/^\$\{approverResolver\.getUserGroups\((.+)\)\}$/)
        const exprMatch = !userMatch && !groupMatch && col.startsWith('${') && col.endsWith('}')
        if (userMatch) {
          approverMode.value = 'user'
          approverValue.value = userMatch[1] ?? ''
        } else if (groupMatch) {
          approverMode.value = 'group'
          approverValue.value = groupMatch[1] ?? ''
        } else if (exprMatch) {
          approverMode.value = 'variable'
          approverValue.value = col.slice(2, -1)
        } else {
          approverMode.value = 'variable'
          approverValue.value = col || ''
        }
      } else {
        isSequential.value = false
        loopCardinality.value = ''
        collection.value = ''
        elementVariable.value = ''
        completionCondition.value = ''
        completionType.value = 'all'
        completionValue.value = null
        normalCompletionType.value = 'all'
        normalCompletionValue.value = null
        approverMode.value = 'variable'
        approverValue.value = ''
      }
      const bo = props.businessObject
      if (bo) {
        asyncBefore.value = bo.asyncBefore === true
        asyncAfter.value = bo.asyncAfter === true
        exclusive.value = bo.exclusive !== false
        retryTimeCycle.value =
          bo['camunda:failedJobRetryTimeCycle'] ?? bo.failedJobRetryTimeCycle ?? ''
      }
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function saveProperties(attrs: Record<string, any>) {
      if (!props.bpmnModeler || !props.element) return
      const modeling = props.bpmnModeler.get('modeling')
      modeling.updateProperties(toRaw(props.element), attrs)
    }

    function onEnabledChange(val: boolean) {
      enabled.value = val
      if (!props.bpmnModeler || !props.element) return
      const moddle = props.bpmnModeler.get('moddle')
      const bo = props.businessObject
      if (!bo) return

      if (val) {
        const lc = moddle.create('bpmn:MultiInstanceLoopCharacteristics', {
          isSequential: isSequential.value,
        })
        if (loopCardinality.value) {
          lc.loopCardinality = moddle.create('bpmn:FormalExpression', {
            body: loopCardinality.value,
          })
        }
        if (collection.value) lc.collection = collection.value
        if (elementVariable.value) lc.elementVariable = elementVariable.value
        if (completionCondition.value) {
          lc.completionCondition = moddle.create('bpmn:FormalExpression', {
            body: completionCondition.value,
          })
        }
        saveProperties({ loopCharacteristics: lc })
      } else {
        saveProperties({ loopCharacteristics: undefined })
      }
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
      elementVariable.value = val ?? ''
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

    function onNormalSequentialChange(val: boolean) {
      isSequential.value = val
      const lc = getLoopCharacteristics()
      if (!lc) return
      lc.isSequential = val
      saveProperties({ loopCharacteristics: lc })
    }

    function onNormalCompletionTypeChange(val: 'all' | 'any' | 'quantity' | 'percentage') {
      normalCompletionType.value = val
      const body = normalCompletionBody.value
      normalCompletionValue.value = null
      setCompletionBody(body)
    }

    function onNormalCompletionValueChange(val: number | null) {
      normalCompletionValue.value = val
      const body = normalCompletionBody.value
      setCompletionBody(body)
    }

    function onApproverModeChange(val: 'variable' | 'user' | 'group') {
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
      const expr = raw ? `\${approverResolver.getUsers(${raw})}` : ''
      collection.value = expr
      updateCollection(expr)
      if (expr && !elementVariable.value) {
        elementVariable.value = 'item'
        updateElementVariable('item')
      }
    }

    function onApproverGroupPickerChange(val: string | null) {
      const raw = val ?? ''
      approverValue.value = raw
      const expr = raw ? `\${approverResolver.getUserGroups(${raw})}` : ''
      collection.value = expr
      updateCollection(expr)
      if (expr && !elementVariable.value) {
        elementVariable.value = 'item'
        updateElementVariable('item')
      }
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

    function updateProperty(key: string, value: any) {
      if (!props.bpmnModeler || !props.element) return
      const modeling = props.bpmnModeler.get('modeling')
      modeling.updateProperties(toRaw(props.element), { [key]: value })
    }

    function onAsyncBeforeChange(val: boolean) {
      asyncBefore.value = val
      updateProperty('asyncBefore', val)
    }

    function onAsyncAfterChange(val: boolean) {
      asyncAfter.value = val
      updateProperty('asyncAfter', val)
    }

    function onExclusiveChange(val: boolean) {
      exclusive.value = val
      updateProperty('exclusive', val)
    }

    function onRetryTimeCycleChange(val: string | null) {
      retryTimeCycle.value = val ?? ''
      updateProperty('failedJobRetryTimeCycle', val ?? '')
    }

    const sequentialOptions = [
      { label: t('bpmnPanel.multiInstance.parallel'), value: 'false' },
      { label: t('bpmnPanel.multiInstance.sequential'), value: 'true' },
    ]

    function onPanelModeChange(val: 'normal' | 'advanced') {
      panelMode.value = val
    }

    return () => (
      <div class="pt-8px">
        <div class="flex items-center justify-between mb-8px">
          <NCheckbox
            checked={enabled.value}
            onUpdateChecked={onEnabledChange}
            size={props.formSize === 'small' ? 'small' : 'medium'}
          >
            {t('bpmnPanel.multiInstance.enable')}
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

        {enabled.value && panelMode.value === 'normal' && (
          <div class="flex flex-col gap-12px mt-8px">
            <div>
              <div class="mb-4px text-12px text-#666">
                {t('bpmnPanel.multiInstance.normalExecutionMode')}
              </div>
              <NRadioGroup
                value={isSequential.value ? 'sequential' : 'parallel'}
                onUpdateValue={(v: string) => onNormalSequentialChange(v === 'sequential')}
                size={props.formSize}
              >
                <NRadioButton value="parallel">{t('bpmnPanel.multiInstance.normalParallel')}</NRadioButton>
                <NRadioButton value="sequential">{t('bpmnPanel.multiInstance.normalSequential')}</NRadioButton>
              </NRadioGroup>
            </div>

            <div>
              <div class="mb-4px text-12px text-#666">
                {t('bpmnPanel.multiInstance.normalApproverList')}
              </div>
              <NRadioGroup
                value={approverMode.value}
                onUpdateValue={onApproverModeChange}
                size={props.formSize}
              >
                <NRadioButton value="variable">{t('bpmnPanel.multiInstance.normalVariable')}</NRadioButton>
                <NRadioButton value="user">{t('bpmnPanel.multiInstance.normalUser')}</NRadioButton>
                <NRadioButton value="group">{t('bpmnPanel.multiInstance.normalGroup')}</NRadioButton>
              </NRadioGroup>
              <div class="mt-8px">
                {approverMode.value === 'variable' && (
                  <NInput
                    value={approverValue.value}
                    onUpdateValue={onApproverValueChange}
                    placeholder={t('bpmnPanel.multiInstance.normalVariablePlaceholder')}
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
                {collection.value && (
                  <div class="mt-4px text-11px text-#999">
                    <code class="bg-#f5f5f5 dark:bg-#333 px-6px py-2px rounded-4px">{collection.value}</code>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div class="mb-4px text-12px text-#666">
                {t('bpmnPanel.multiInstance.normalCompletionRule')}
              </div>
              <NRadioGroup
                value={normalCompletionType.value}
                onUpdateValue={onNormalCompletionTypeChange}
                size={props.formSize}
              >
                <div class="flex flex-col gap-4px">
                  <NRadio value="all">{t('bpmnPanel.multiInstance.normalCompletionAll')}</NRadio>
                  <NRadio value="any">{t('bpmnPanel.multiInstance.normalCompletionAny')}</NRadio>
                  <div class="grid grid-cols-[auto_auto_1fr] items-center gap-4px w-full">
                    <NRadio value="quantity" />
                    <span class="text-12px flex-shrink-0">{t('bpmnPanel.multiInstance.normalCompletionQuantity')}</span>
                    {normalCompletionType.value === 'quantity' && (
                      <NInputNumber
                        value={normalCompletionValue.value}
                        onUpdateValue={onNormalCompletionValueChange}
                        size={props.formSize}
                        style="width:100%"
                        min={1}
                        placeholder="0"
                      />
                    )}
                  </div>
                  <div class="grid grid-cols-[auto_auto_1fr] items-center gap-4px w-full">
                    <NRadio value="percentage" />
                    <span class="text-12px flex-shrink-0">{t('bpmnPanel.multiInstance.normalCompletionPercentage')}</span>
                    {normalCompletionType.value === 'percentage' && (
                      <div class="flex items-center gap-2px" style="width:100%">
                        <NInputNumber
                          value={normalCompletionValue.value}
                          onUpdateValue={onNormalCompletionValueChange}
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
                </div>
              </NRadioGroup>
            </div>
          </div>
        )}

        {enabled.value && panelMode.value === 'advanced' && (
          <div class="flex flex-col gap-8px mt-12px">
            <div>
              <div class="mb-4px text-12px text-#666">
                {t('bpmnPanel.multiInstance.type')}
              </div>
              <NSelect
                value={isSequential.value ? 'true' : 'false'}
                onUpdateValue={(v: string | null) => onSequentialChange(v === 'true')}
                options={sequentialOptions}
                size={props.formSize}
              />
            </div>
            <div>
              <div class="mb-4px text-12px text-#666">
                {t('bpmnPanel.fields.loopCardinality')}
              </div>
              <NInput
                value={loopCardinality.value}
                onUpdateValue={onLoopCardinalityChange}
                placeholder={t('bpmnPanel.placeholders.loopCardinality')}
                size={props.formSize}
              />
            </div>
            <div>
              <div class="mb-4px text-12px text-#666">
                {t('bpmnPanel.fields.collection')}
              </div>
              <NInput
                value={collection.value}
                onUpdateValue={onCollectionChange}
                placeholder={t('bpmnPanel.placeholders.collection')}
                size={props.formSize}
              />
            </div>
            <div>
              <div class="mb-4px text-12px text-#666">
                {t('bpmnPanel.fields.elementVariable')}
              </div>
              <NInput
                value={elementVariable.value}
                onUpdateValue={onElementVariableChange}
                placeholder={t('bpmnPanel.placeholders.elementVariable')}
                size={props.formSize}
              />
            </div>
            <div>
              <div class="mb-4px text-12px text-#666 flex items-center gap-4px">
                <span>{t('bpmnPanel.multiInstance.completionCondition')}</span>
                {completionExpressionDisplay.value && (
                  <code class="text-11px text-#999 bg-#f5f5f5 dark:bg-#333 px-6px py-2px rounded-4px">
                    {completionExpressionDisplay.value}
                  </code>
                )}
              </div>
              <NRadioGroup
                value={completionType.value}
                onUpdateValue={onCompletionTypeChange}
                size={props.formSize}
              >
                <div class="flex flex-col gap-4px w-full">
                  <NRadio size={props.formSize} value="all">{t('bpmnPanel.multiInstance.completionAll')}</NRadio>
                  <NRadio size={props.formSize} value="any">{t('bpmnPanel.multiInstance.completionAny')}</NRadio>
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
                    <NRadio size={props.formSize} value="advanced" >{t('bpmnPanel.multiInstance.completionAdvanced')}</NRadio>
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
            <div class="mb-4px mt-4px text-12px text-#666">
              {t('bpmnPanel.fields.asyncContinuousExecution')}
            </div>
            <div class="flex flex-row gap-8px">
              <NCheckbox
                checked={asyncBefore.value}
                onUpdateChecked={onAsyncBeforeChange}
                size={props.formSize === 'small' ? 'small' : 'medium'}
              >
                {t('bpmnPanel.fields.asyncBefore')}
              </NCheckbox>
              <NCheckbox
                checked={asyncAfter.value}
                onUpdateChecked={onAsyncAfterChange}
                size={props.formSize === 'small' ? 'small' : 'medium'}
              >
                {t('bpmnPanel.fields.asyncAfter')}
              </NCheckbox>
              <NCheckbox
                checked={exclusive.value}
                onUpdateChecked={onExclusiveChange}
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
                  onUpdateValue={onRetryTimeCycleChange}
                  placeholder={t('bpmnPanel.placeholders.retryTimeCycle')}
                  size={props.formSize}
                />
              </div>
            )}
          </div>
        )}
      </div>
    )
  },
})