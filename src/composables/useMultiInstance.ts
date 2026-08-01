import { ref, computed, toRaw, type Ref } from 'vue'

/** 多实例组件的基础属性 */
export interface UseMultiInstanceProps {
  /** BPMN 业务对象（businessObject） */
  businessObject: any
  /** BPMN 图形元素 */
  element: any
  /** bpmn-js 建模器实例 */
  bpmnModeler: any
}

/** useMultiInstance 的配置选项 */
export interface UseMultiInstanceOptions {
  /** 获取当前组件的 props（businessObject / element / bpmnModeler） */
  props: () => UseMultiInstanceProps
  /** 构建循环特性后的钩子，可补充自定义 moddle 属性 */
  onBuildLc?: (lc: any, moddle: any) => void
  /** 启用多实例后的回调 */
  onEnable?: (lc: any) => void
  /** 禁用多实例后的回调 */
  onDisable?: () => void
  /** 元素变量变化回调 */
  onElementVariableChange?: (val: string) => void
}

/**
 * useMultiInstance 的返回值：多实例状态与操作方法
 *
 * - 状态均为响应式 ref，可直接绑定到表单控件
 * - 操作方法会把变更写入 bpmn-js 建模器并同步模型
 */
export interface UseMultiInstance {
  /** 是否启用多实例 */
  enabled: Ref<boolean>
  /** 是否串行执行 */
  isSequential: Ref<boolean>
  /** 循环次数表达式（loopCardinality） */
  loopCardinality: Ref<string>
  /** 集合变量名 */
  collection: Ref<string>
  /** 元素变量名 */
  elementVariable: Ref<string>
  /** 完成条件表达式（原生 body） */
  completionCondition: Ref<string>
  /** 完成类型：all / any / quantity / percentage / advanced */
  completionType: Ref<'all' | 'any' | 'quantity' | 'percentage' | 'advanced'>
  /** 数量 / 百分比完成条件的数值 */
  completionValue: Ref<number | null>
  /** 异步前置 */
  asyncBefore: Ref<boolean>
  /** 异步后置 */
  asyncAfter: Ref<boolean>
  /** 是否排他 */
  exclusive: Ref<boolean>
  /** 失败重试时间周期（ISO 8601） */
  retryTimeCycle: Ref<string>
  /** 是否显示异步 / 重试配置 */
  showJobExecution: Ref<boolean>
  /** 完成条件的展示表达式 */
  completionExpressionDisplay: Ref<string>
  /** 获取当前循环特性对象 */
  getLoopCharacteristics: () => any
  /** 从模型同步本地状态 */
  syncFromModel: () => void
  /** 调用建模器更新元素属性 */
  saveProperties: (attrs: Record<string, any>) => void
  /** 更新单个元素属性 */
  updateProperty: (key: string, value: any) => void
  /** 启用 / 禁用多实例 */
  enable: (val: boolean, extraAttrs?: Record<string, any>) => void
  /** 切换串行 / 并行 */
  onSequentialChange: (val: boolean) => void
  /** 修改循环次数表达式 */
  onLoopCardinalityChange: (val: string | null) => void
  /** 修改集合变量名 */
  onCollectionChange: (val: string | null) => void
  /** 修改元素变量名 */
  onElementVariableChange: (val: string | null) => void
  /** 修改完成类型 */
  onCompletionTypeChange: (val: 'all' | 'any' | 'quantity' | 'percentage' | 'advanced') => void
  /** 修改完成数值（数量 / 百分比） */
  onCompletionValueChange: (val: number | null) => void
  /** 修改高级完成表达式 */
  onCompletionAdvancedChange: (val: string | null) => void
  /** 切换异步前置 */
  onAsyncBeforeChange: (val: boolean) => void
  /** 切换异步后置 */
  onAsyncAfterChange: (val: boolean) => void
  /** 切换排他 */
  onExclusiveChange: (val: boolean) => void
  /** 修改失败重试时间周期 */
  onRetryTimeCycleChange: (val: string | null) => void
  /** 直接设置完成条件表达式 */
  setCompletionBody: (body: string) => void
  /** 更新集合变量（仅写模型） */
  updateCollection: (val: string) => void
  /** 更新元素变量（仅写模型） */
  updateElementVariable: (val: string) => void
}

/**
 * @description 多实例循环特性（Multi-Instance）的状态管理与模型同步。
 *
 * 封装 `bpmn:MultiInstanceLoopCharacteristics` 的读写能力：
 * 启用 / 禁用、串行 / 并行、循环次数、集合与元素变量、完成条件
 * （全部 / 任一 / 数量 / 百分比 / 高级表达式）、异步执行与失败重试周期，
 * 所有变更都会同步回 bpmn-js 建模器。
 *
 * ## 基本用法
 *
 * ```ts
 * const mi = useMultiInstance({
 *   props: () => ({ businessObject, element, bpmnModeler }),
 * })
 *
 * mi.syncFromModel()
 * mi.enable(true)
 * mi.onCompletionTypeChange('quantity')
 * ```
 *
 * @param options 配置选项，见 {@link UseMultiInstanceOptions}
 * @returns 多实例状态与操作方法，见 {@link UseMultiInstance}
 */
export function useMultiInstance(options: UseMultiInstanceOptions): UseMultiInstance {
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
  const exclusive = ref(true)
  const retryTimeCycle = ref('')

  const showJobExecution = computed(() => asyncBefore.value || asyncAfter.value)

  /** 根据完成类型生成对应的完成条件表达式 */
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

  /** 获取业务对象上的多实例循环特性 */
  function getLoopCharacteristics(): any {
    const bo = options.props().businessObject
    if (!bo) return null
    const lc = bo.loopCharacteristics
    if (lc && lc.$type === 'bpmn:MultiInstanceLoopCharacteristics') return lc
    return null
  }

  /** 从模型读取循环特性并同步本地状态 */
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
      const pctMatch = body.match(
        /^\$\{nrOfCompletedInstances\s*>=\s*nrOfInstances\s*\*\s*(\d+)\s*\/\s*100\}$/,
      )
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
      collection.value = lc.collection || ''
      elementVariable.value = lc.elementVariable || ''
      asyncBefore.value = lc.asyncBefore === true
      asyncAfter.value = lc.asyncAfter === true
      exclusive.value = lc.exclusive !== false
      const lcExtValues = lc.extensionElements?.values || []
      const lcRetryCycle = lcExtValues.find(
        (v: any) => v.$type === 'camunda:FailedJobRetryTimeCycle',
      )
      retryTimeCycle.value = lcRetryCycle?.body ?? ''
    } else {
      isSequential.value = false
      loopCardinality.value = ''
      collection.value = ''
      elementVariable.value = ''
      completionCondition.value = ''
      completionType.value = 'all'
      completionValue.value = null
      asyncBefore.value = false
      asyncAfter.value = false
      exclusive.value = true
      retryTimeCycle.value = ''
    }
  }

  /** 调用建模器更新元素属性 */
  function saveProperties(attrs: Record<string, any>) {
    const { bpmnModeler, element } = options.props()
    if (!bpmnModeler || !element) return
    bpmnModeler.get('modeling').updateProperties(toRaw(element), attrs)
  }

  function updateProperty(key: string, value: any) {
    saveProperties({ [key]: value })
  }

  function updateLcAsyncProps(lc: any) {
    if (asyncBefore.value) lc.asyncBefore = true
    else delete lc.asyncBefore
    if (asyncAfter.value) lc.asyncAfter = true
    else delete lc.asyncAfter
    if (!exclusive.value) lc.exclusive = false
    else delete lc.exclusive
    const moddle = options.props().bpmnModeler?.get('moddle')
    if (!moddle) return
    if (retryTimeCycle.value) {
      if (!lc.extensionElements) {
        lc.extensionElements = moddle.create('bpmn:ExtensionElements', { values: [] })
      }
      const ee = lc.extensionElements
      let retry = ee.values.find((v: any) => v.$type === 'camunda:FailedJobRetryTimeCycle')
      if (!retry) {
        retry = moddle.create('camunda:FailedJobRetryTimeCycle', { body: retryTimeCycle.value })
        ee.get('values').push(retry)
      } else {
        retry.body = retryTimeCycle.value
      }
    } else if (lc.extensionElements) {
      const ee = lc.extensionElements
      const retry = ee.values.find((v: any) => v.$type === 'camunda:FailedJobRetryTimeCycle')
      if (retry) {
        ee.values = ee.values.filter((v: any) => v !== retry)
      }
    }
  }

  /** 启用/禁用多实例（创建或移除循环特性） */
  function enable(val: boolean, extraAttrs: Record<string, any> = {}) {
    enabled.value = val
    const { bpmnModeler, businessObject } = options.props()
    if (!bpmnModeler || !businessObject) return
    const moddle = bpmnModeler.get('moddle')

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
      updateLcAsyncProps(lc)
      options.onBuildLc?.(lc, moddle)
      saveProperties({ loopCharacteristics: lc, ...extraAttrs })
      options.onEnable?.(lc)
    } else {
      saveProperties({ loopCharacteristics: undefined, ...extraAttrs })
      options.onDisable?.()
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
    const lc = getLoopCharacteristics()
    if (!lc) return
    const moddle = options.props().bpmnModeler?.get('moddle')
    if (!moddle) return
    if (val) {
      if (!lc.loopCardinality) {
        lc.loopCardinality = moddle.create('bpmn:FormalExpression', { body: val })
      } else {
        lc.loopCardinality.body = val
      }
    } else {
      lc.loopCardinality = undefined
    }
    saveProperties({ loopCharacteristics: lc })
  }

  function onCollectionChange(val: string | null) {
    collection.value = val ?? ''
    const lc = getLoopCharacteristics()
    if (!lc) return
    lc.collection = val || undefined
    saveProperties({ loopCharacteristics: lc })
  }

  function onElementVariableChange(val: string | null) {
    const raw = val ?? ''
    elementVariable.value = raw
    const lc = getLoopCharacteristics()
    if (!lc) return
    lc.elementVariable = raw || undefined
    saveProperties({ loopCharacteristics: lc })
    options.onElementVariableChange?.(raw)
  }

  function setCompletionBody(body: string) {
    completionCondition.value = body
    const lc = getLoopCharacteristics()
    if (!lc) return
    const moddle = options.props().bpmnModeler?.get('moddle')
    if (!moddle) return
    if (body) {
      if (!lc.completionCondition) {
        lc.completionCondition = moddle.create('bpmn:FormalExpression', { body })
      } else {
        lc.completionCondition.body = body
      }
    } else {
      lc.completionCondition = undefined
    }
    saveProperties({ loopCharacteristics: lc })
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
          setCompletionBody(
            `\${nrOfCompletedInstances >= nrOfInstances * ${completionValue.value} / 100}`,
          )
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

  function onAsyncBeforeChange(val: boolean) {
    asyncBefore.value = val
    const lc = getLoopCharacteristics()
    if (!lc) return
    if (val) lc.asyncBefore = true
    else delete lc.asyncBefore
    saveProperties({ loopCharacteristics: lc })
  }

  function onAsyncAfterChange(val: boolean) {
    asyncAfter.value = val
    const lc = getLoopCharacteristics()
    if (!lc) return
    if (val) lc.asyncAfter = true
    else delete lc.asyncAfter
    saveProperties({ loopCharacteristics: lc })
  }

  function onExclusiveChange(val: boolean) {
    exclusive.value = val
    const lc = getLoopCharacteristics()
    if (!lc) return
    if (!val) lc.exclusive = false
    else delete lc.exclusive
    saveProperties({ loopCharacteristics: lc })
  }

  function onRetryTimeCycleChange(val: string | null) {
    retryTimeCycle.value = val ?? ''
    const lc = getLoopCharacteristics()
    if (!lc) return
    const moddle = options.props().bpmnModeler?.get('moddle')
    if (!moddle) return
    if (!lc.extensionElements) {
      lc.extensionElements = moddle.create('bpmn:ExtensionElements', { values: [] })
    }
    const ee = lc.extensionElements
    let retry = ee.values.find((v: any) => v.$type === 'camunda:FailedJobRetryTimeCycle')
    if (val) {
      if (!retry) {
        retry = moddle.create('camunda:FailedJobRetryTimeCycle', { body: val })
        ee.get('values').push(retry)
      } else {
        retry.body = val
      }
    } else if (retry) {
      ee.values = ee.values.filter((v: any) => v !== retry)
    }
    saveProperties({ loopCharacteristics: lc })
  }

  function updateCollection(val: string) {
    const lc = getLoopCharacteristics()
    if (!lc) return
    lc.collection = val || undefined
    saveProperties({ loopCharacteristics: lc })
  }

  function updateElementVariable(val: string) {
    const lc = getLoopCharacteristics()
    if (!lc) return
    lc.elementVariable = val || undefined
    saveProperties({ loopCharacteristics: lc })
  }

  return {
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
    getLoopCharacteristics,
    syncFromModel,
    saveProperties,
    updateProperty,
    enable,
    onSequentialChange,
    onLoopCardinalityChange,
    onCollectionChange,
    onElementVariableChange,
    onCompletionTypeChange,
    onCompletionValueChange,
    onCompletionAdvancedChange,
    onAsyncBeforeChange,
    onAsyncAfterChange,
    onExclusiveChange,
    onRetryTimeCycleChange,
    setCompletionBody,
    updateCollection,
    updateElementVariable,
  }
}
