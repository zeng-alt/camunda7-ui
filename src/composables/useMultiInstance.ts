import { ref, computed, toRaw, type Ref } from 'vue'

export interface UseMultiInstanceProps {
  businessObject: any
  element: any
  bpmnModeler: any
}

export interface UseMultiInstanceOptions {
  props: () => UseMultiInstanceProps
  onBuildLc?: (lc: any, moddle: any) => void
  onEnable?: (lc: any) => void
  onDisable?: () => void
  onElementVariableChange?: (val: string) => void
}

export interface UseMultiInstance {
  enabled: Ref<boolean>
  isSequential: Ref<boolean>
  loopCardinality: Ref<string>
  collection: Ref<string>
  elementVariable: Ref<string>
  completionCondition: Ref<string>
  completionType: Ref<'all' | 'any' | 'quantity' | 'percentage' | 'advanced'>
  completionValue: Ref<number | null>
  asyncBefore: Ref<boolean>
  asyncAfter: Ref<boolean>
  exclusive: Ref<boolean>
  retryTimeCycle: Ref<string>
  showJobExecution: Ref<boolean>
  completionExpressionDisplay: Ref<string>
  getLoopCharacteristics: () => any
  syncFromModel: () => void
  saveProperties: (attrs: Record<string, any>) => void
  updateProperty: (key: string, value: any) => void
  enable: (val: boolean, extraAttrs?: Record<string, any>) => void
  onSequentialChange: (val: boolean) => void
  onLoopCardinalityChange: (val: string | null) => void
  onCollectionChange: (val: string | null) => void
  onElementVariableChange: (val: string | null) => void
  onCompletionTypeChange: (val: 'all' | 'any' | 'quantity' | 'percentage' | 'advanced') => void
  onCompletionValueChange: (val: number | null) => void
  onCompletionAdvancedChange: (val: string | null) => void
  onAsyncBeforeChange: (val: boolean) => void
  onAsyncAfterChange: (val: boolean) => void
  onExclusiveChange: (val: boolean) => void
  onRetryTimeCycleChange: (val: string | null) => void
  setCompletionBody: (body: string) => void
  updateCollection: (val: string) => void
  updateElementVariable: (val: string) => void
}

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
    const bo = options.props().businessObject
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
