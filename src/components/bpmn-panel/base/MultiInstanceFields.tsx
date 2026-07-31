import { defineComponent, ref, computed, watch, type PropType } from 'vue'
import {
  NCheckbox,
  NInput,
  NSelect,
  NInputNumber,
  NTooltip,
  NRadioGroup,
  NRadioButton,
  NRadio,
} from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useMultiInstance, useFormSize } from '@/composables'
import UserPicker from './UserPicker'
import GroupPicker from './GroupPicker'

export default defineComponent({
  name: 'MultiInstanceFields',
  props: {
    // 当前元素的 BPMN 业务对象（BusinessObject），用于读写模型属性
    businessObject: { type: Object as PropType<any>, default: null },
    // 当前选中的 BPMN 图形元素
    element: { type: Object as PropType<any>, default: null },
    // bpmn-js 模型器实例，用于执行建模命令、读写模型
    bpmnModeler: { type: Object, default: null },
    // 表单控件尺寸：small / medium / large
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    // 用户解析器表达式，用于解析办理人/候选人
    userResolver: { type: String, default: 'approverResolver.getUsers' },
    // 用户组解析器表达式，用于解析候选用户组
    groupResolver: { type: String, default: 'approverResolver.getUserGroups' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const { labelClass } = useFormSize(() => props.formSize)

    const mi = useMultiInstance({ props: () => props })
    const {
      enabled,
      isSequential,
      loopCardinality,
      collection,
      elementVariable,
      completionCondition,
      completionType,
      completionValue,
      asyncBefore,
      asyncAfter,
      exclusive,
      retryTimeCycle,
      showJobExecution,
      completionExpressionDisplay,
    } = mi

    const panelMode = ref<'normal' | 'advanced'>('normal')

    const normalCompletionType = ref<'all' | 'any' | 'quantity' | 'percentage'>('all')
    const normalCompletionValue = ref<number | null>(null)
    const approverMode = ref<'variable' | 'user' | 'group'>('variable')
    const approverValue = ref('')

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

    function syncFromModel() {
      mi.syncFromModel()
      const lc = mi.getLoopCharacteristics()
      if (lc) {
        const body = lc.completionCondition?.body || ''
        const anyMatch = body.match(/^\$\{nrOfCompletedInstances\s*>=\s*1\}$/)
        const qtyMatch = body.match(/^\$\{nrOfCompletedInstances\s*>=\s*(\d+)\}$/)
        const pctMatch = body.match(
          /^\$\{nrOfCompletedInstances\s*>=\s*nrOfInstances\s*\*\s*(\d+)\s*\/\s*100\}$/,
        )
        if (anyMatch) {
          normalCompletionType.value = 'any'
          normalCompletionValue.value = null
        } else if (qtyMatch) {
          normalCompletionType.value = 'quantity'
          normalCompletionValue.value = Number(qtyMatch[1])
        } else if (pctMatch) {
          normalCompletionType.value = 'percentage'
          normalCompletionValue.value = Number(pctMatch[1])
        } else {
          normalCompletionType.value = 'all'
          normalCompletionValue.value = null
        }
        const col = lc.collection || ''
        const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const userRe = new RegExp(`^\\$\\{${escapeRe(props.userResolver)}\\((.+)\\)\\}$`)
        const groupRe = new RegExp(`^\\$\\{${escapeRe(props.groupResolver)}\\((.+)\\)\\}$`)
        const userMatch = col.match(userRe)
        const groupMatch = col.match(groupRe)
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
        normalCompletionType.value = 'all'
        normalCompletionValue.value = null
        approverMode.value = 'variable'
        approverValue.value = ''
      }
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function onNormalSequentialChange(val: boolean) {
      mi.onSequentialChange(val)
    }

    function onNormalCompletionTypeChange(val: 'all' | 'any' | 'quantity' | 'percentage') {
      normalCompletionType.value = val
      const body = normalCompletionBody.value
      normalCompletionValue.value = null
      mi.setCompletionBody(body)
    }

    function onNormalCompletionValueChange(val: number | null) {
      normalCompletionValue.value = val
      mi.setCompletionBody(normalCompletionBody.value)
    }

    function onApproverModeChange(val: 'variable' | 'user' | 'group') {
      approverMode.value = val
      approverValue.value = ''
      collection.value = ''
      mi.updateCollection('')
    }

    function onApproverValueChange(val: string | null) {
      const raw = val ?? ''
      approverValue.value = raw
      const expr = raw ? `\${${raw}}` : ''
      collection.value = expr
      mi.updateCollection(expr)
      if (expr && !elementVariable.value) {
        elementVariable.value = 'item'
        mi.updateElementVariable('item')
      }
    }

    function onApproverUserPickerChange(val: string | null) {
      const raw = val ?? ''
      approverValue.value = raw
      const expr = raw ? `\${${props.userResolver}(${raw})}` : ''
      collection.value = expr
      mi.updateCollection(expr)
      if (expr && !elementVariable.value) {
        elementVariable.value = 'item'
        mi.updateElementVariable('item')
      }
    }

    function onApproverGroupPickerChange(val: string | null) {
      const raw = val ?? ''
      approverValue.value = raw
      const expr = raw ? `\${${props.groupResolver}(${raw})}` : ''
      collection.value = expr
      mi.updateCollection(expr)
      if (expr && !elementVariable.value) {
        elementVariable.value = 'item'
        mi.updateElementVariable('item')
      }
    }

    function onPanelModeChange(val: 'normal' | 'advanced') {
      panelMode.value = val
    }

    const sequentialOptions = [
      { label: t('bpmnPanel.multiInstance.parallel'), value: 'false' },
      { label: t('bpmnPanel.multiInstance.sequential'), value: 'true' },
    ]

    return () => (
      <div class="pt-8px">
        <div class="flex items-center justify-between mb-8px">
          <NCheckbox
            checked={enabled.value}
            onUpdateChecked={mi.enable}
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
              <div class={`mb-4px ${labelClass}`}>
                {t('bpmnPanel.multiInstance.normalExecutionMode')}
              </div>
              <NRadioGroup
                value={isSequential.value ? 'sequential' : 'parallel'}
                onUpdateValue={(v: string) => onNormalSequentialChange(v === 'sequential')}
                size={props.formSize}
              >
                <NRadioButton value="parallel">
                  {t('bpmnPanel.multiInstance.normalParallel')}
                </NRadioButton>
                <NRadioButton value="sequential">
                  {t('bpmnPanel.multiInstance.normalSequential')}
                </NRadioButton>
              </NRadioGroup>
            </div>

            <div>
              <div class={`mb-4px ${labelClass}`}>
                {t('bpmnPanel.multiInstance.normalApproverList')}
              </div>
              <NRadioGroup
                value={approverMode.value}
                onUpdateValue={onApproverModeChange}
                size={props.formSize}
              >
                <NRadioButton value="variable">
                  {t('bpmnPanel.multiInstance.normalVariable')}
                </NRadioButton>
                <NRadioButton value="user">{t('bpmnPanel.multiInstance.normalUser')}</NRadioButton>
                <NRadioButton value="group">
                  {t('bpmnPanel.multiInstance.normalGroup')}
                </NRadioButton>
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
                    <code class="bg-#f5f5f5 dark:bg-#333 px-6px py-2px rounded-4px">
                      {collection.value}
                    </code>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div class={`mb-4px ${labelClass}`}>
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
                    <NRadio value="quantity">
                      {t('bpmnPanel.multiInstance.normalCompletionQuantity')}
                    </NRadio>
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
                    <NRadio value="percentage">
                      {t('bpmnPanel.multiInstance.normalCompletionPercentage')}
                    </NRadio>
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
                        <span class={`${labelClass} flex-shrink-0`}>%</span>
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
              <div class={`mb-4px ${labelClass}`}>{t('bpmnPanel.multiInstance.type')}</div>
              <NSelect
                value={isSequential.value ? 'true' : 'false'}
                onUpdateValue={(v: string | null) => mi.onSequentialChange(v === 'true')}
                options={sequentialOptions}
                size={props.formSize}
              />
            </div>
            <div>
              <div class={`mb-4px ${labelClass}`}>{t('bpmnPanel.fields.loopCardinality')}</div>
              <NInput
                value={loopCardinality.value}
                onUpdateValue={mi.onLoopCardinalityChange}
                placeholder={t('bpmnPanel.placeholders.loopCardinality')}
                size={props.formSize}
              />
            </div>
            <div>
              <div class={`mb-4px ${labelClass}`}>{t('bpmnPanel.fields.collection')}</div>
              <NInput
                value={collection.value}
                onUpdateValue={mi.onCollectionChange}
                placeholder={t('bpmnPanel.placeholders.collection')}
                size={props.formSize}
              />
            </div>
            <div>
              <div class={`mb-4px ${labelClass}`}>{t('bpmnPanel.fields.elementVariable')}</div>
              <NInput
                value={elementVariable.value}
                onUpdateValue={mi.onElementVariableChange}
                placeholder={t('bpmnPanel.placeholders.elementVariable')}
                size={props.formSize}
              />
            </div>
            <div>
              <div class={`mb-4px ${labelClass} flex items-center gap-4px`}>
                <span>{t('bpmnPanel.multiInstance.completionCondition')}</span>
                {completionExpressionDisplay.value && (
                  <code class="text-11px text-#999 bg-#f5f5f5 dark:bg-#333 px-6px py-2px rounded-4px">
                    {completionExpressionDisplay.value}
                  </code>
                )}
              </div>
              <NRadioGroup
                value={completionType.value}
                onUpdateValue={mi.onCompletionTypeChange}
                size={props.formSize}
              >
                <div class="flex flex-col gap-4px w-full">
                  <NRadio size={props.formSize} value="all">
                    {t('bpmnPanel.multiInstance.completionAll')}
                  </NRadio>
                  <NRadio size={props.formSize} value="any">
                    {t('bpmnPanel.multiInstance.completionAny')}
                  </NRadio>
                  <div class="grid grid-cols-[auto_auto_1fr] items-center gap-4px w-full">
                    <NRadio size={props.formSize} value="quantity">
                      {t('bpmnPanel.multiInstance.completionQuantity')}
                    </NRadio>
                    {completionType.value === 'quantity' && (
                      <NInputNumber
                        value={completionValue.value}
                        onUpdateValue={mi.onCompletionValueChange}
                        size={props.formSize}
                        style="width:100%"
                        min={1}
                        placeholder="0"
                      />
                    )}
                  </div>
                  <div class="grid grid-cols-[auto_auto_1fr] items-center gap-4px w-full">
                    <NRadio size={props.formSize} value="percentage">
                      {t('bpmnPanel.multiInstance.completionPercentage')}
                    </NRadio>
                    {completionType.value === 'percentage' && (
                      <div class="flex items-center gap-2px" style="width:100%">
                        <NInputNumber
                          value={completionValue.value}
                          onUpdateValue={mi.onCompletionValueChange}
                          size={props.formSize}
                          style="width:100%"
                          min={1}
                          max={100}
                          placeholder="0"
                        />
                        <span class={`${labelClass} flex-shrink-0`}>%</span>
                      </div>
                    )}
                  </div>
                  <div class="grid grid-cols-[auto_auto_1fr] items-center gap-4px w-full">
                    <NRadio size={props.formSize} value="advanced">
                      {t('bpmnPanel.multiInstance.completionAdvanced')}
                    </NRadio>
                    {completionType.value === 'advanced' && (
                      <NInput
                        value={completionCondition.value}
                        onUpdateValue={mi.onCompletionAdvancedChange}
                        placeholder={t('bpmnPanel.placeholders.completionCondition')}
                        size={props.formSize}
                        style="width:100%"
                      />
                    )}
                  </div>
                </div>
              </NRadioGroup>
            </div>
            <div class={`mb-4px mt-4px ${labelClass}`}>
              {t('bpmnPanel.fields.asyncContinuousExecution')}
            </div>
            <div class="flex flex-row gap-8px">
              <NCheckbox
                checked={asyncBefore.value}
                onUpdateChecked={mi.onAsyncBeforeChange}
                size={props.formSize === 'small' ? 'small' : 'medium'}
              >
                {t('bpmnPanel.fields.asyncBefore')}
              </NCheckbox>
              <NCheckbox
                checked={asyncAfter.value}
                onUpdateChecked={mi.onAsyncAfterChange}
                size={props.formSize === 'small' ? 'small' : 'medium'}
              >
                {t('bpmnPanel.fields.asyncAfter')}
              </NCheckbox>
              <NCheckbox
                checked={exclusive.value}
                onUpdateChecked={mi.onExclusiveChange}
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
                  onUpdateValue={mi.onRetryTimeCycleChange}
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
