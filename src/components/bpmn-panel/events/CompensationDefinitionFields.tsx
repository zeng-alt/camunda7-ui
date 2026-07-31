import { defineComponent, ref, watch, toRaw, type PropType } from 'vue'
import { NCheckbox, NSelect } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { getDefinitions } from './eventHelpers'

function collectActivityIds(bo: any): string[] {
  const ids: string[] = []
  const defs = getDefinitions(bo)
  if (!defs) return ids

  function walkElements(elements: any[]) {
    for (const el of elements || []) {
      if (el.$type === 'bpmn:SubProcess' || el.$type === 'bpmn:Transaction') {
        walkElements(el.flowElements)
      }
      const t = el.$type?.replace('bpmn:', '')
      if (
        t &&
        (t.endsWith('Task') || t === 'SubProcess' || t === 'CallActivity' || t === 'Transaction')
      ) {
        if (el.id) ids.push(el.id)
      }
    }
  }

  for (const root of defs.rootElements || []) {
    if (root.$type === 'bpmn:Process') {
      walkElements(root.flowElements)
    }
  }
  return ids
}

export default defineComponent({
  name: 'CompensationDefinitionFields',
  props: {
    // 当前元素的 BPMN 业务对象（BusinessObject），用于读写模型属性
    businessObject: { type: Object as PropType<any>, default: null },
    // 当前选中的 BPMN 图形元素
    element: { type: Object as PropType<any>, default: null },
    // bpmn-js 模型器实例，用于执行建模命令、读写模型
    bpmnModeler: { type: Object, default: null },
    // 表单控件尺寸：small / medium / large
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const activityRef = ref('')
    const waitForCompletion = ref(false)
    const activityOptions = ref<{ label: string; value: string }[]>([])

    function getEventDef() {
      return props.businessObject?.eventDefinitions?.[0]
    }

    function buildActivityOptions() {
      const bo = toRaw(props.businessObject)
      const ids = collectActivityIds(bo)
      const opts: { label: string; value: string }[] = [
        { label: t('bpmnPanel.eventDef.none'), value: '' },
      ]
      for (const id of ids) {
        opts.push({ label: id, value: id })
      }
      activityOptions.value = opts
    }

    function syncFromModel() {
      const def = getEventDef()
      if (!def) return
      activityRef.value = def.activityRef?.id || ''
      waitForCompletion.value = def.waitForCompletion === true
      buildActivityOptions()
    }

    watch(() => props.businessObject, syncFromModel, { immediate: true, deep: true })
    watch(() => props.element, syncFromModel, { immediate: true })

    function onActivityRefChange(val: string | null) {
      activityRef.value = val ?? ''
      const ed = getEventDef()
      if (!props.bpmnModeler || !props.element || !ed) return
      const modeling = props.bpmnModeler.get('modeling')

      if (!val) {
        modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), { activityRef: undefined })
        return
      }

      const moddle = props.bpmnModeler.get('moddle')
      const ref = moddle.create('bpmn:Activity', { id: val })
      modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), { activityRef: ref })
    }

    function onWaitForCompletionChange(val: boolean) {
      waitForCompletion.value = val
      const ed = getEventDef()
      if (!props.bpmnModeler || !props.element || !ed) return
      const modeling = props.bpmnModeler.get('modeling')
      modeling.updateModdleProperties(toRaw(props.element), toRaw(ed), { waitForCompletion: val })
    }

    const checkboxSize = props.formSize === 'small' ? 'small' : 'medium'

    return () => (
      <div>
        <div class="mb-4px text-12px text-#666">{t('bpmnPanel.fields.activityRef')}</div>
        <NSelect
          value={activityRef.value}
          onUpdateValue={onActivityRefChange}
          options={activityOptions.value}
          size={props.formSize}
          placeholder={t('bpmnPanel.placeholders.activityRef')}
          filterable
          tag
        />
        <div class="mt-8px">
          <NCheckbox
            checked={waitForCompletion.value}
            onUpdateChecked={onWaitForCompletionChange}
            size={checkboxSize}
          >
            {t('bpmnPanel.fields.waitForCompletion')}
          </NCheckbox>
        </div>
      </div>
    )
  },
})
