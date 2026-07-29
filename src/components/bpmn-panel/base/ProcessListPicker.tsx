import { defineComponent, ref, computed, type PropType } from 'vue'
import { NInput, NSelect } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useCamundaLookups } from '../../../composables'
import type { ProcessLookupItem } from '../../../composables'

export default defineComponent({
  name: 'ProcessListPicker',
  props: {
    value: { type: String, default: '' },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    placeholder: { type: String, default: '' },
    label: { type: String, default: '' },
    hint: { type: String, default: '' },
  },
  emits: ['update:value', 'update:item'],
  setup(props, { emit }) {
    const { t } = useCamundaI18n()
    const { lookups } = useCamundaLookups()

    const processList = ref<ProcessLookupItem[]>([])
    const loaded = ref(false)

    const hasFetchFn = computed(() => !!lookups.fetchProcessList)

    const selectOptions = computed(() =>
      processList.value.map((item) => ({
        label: `${item.label} (${item.value})`,
        value: item.value,
      })),
    )

    async function loadProcesses() {
      if (!lookups.fetchProcessList || loaded.value) return
      try {
        processList.value = await lookups.fetchProcessList()
        loaded.value = true
      } catch {
        processList.value = []
      }
    }

    function onOpen() {
      loadProcesses()
    }

    function onChange(val: string | null) {
      const item = processList.value.find((p) => p.value === val) || null
      emit('update:value', val ?? '')
      emit('update:item', item)
    }

    const placeholderText = computed(
      () => props.placeholder || t('bpmnPanel.placeholders.processRef'),
    )

    return () => (
      <div>
        {props.label && <div class="mb-4px text-12px text-#666">{props.label}</div>}
        {hasFetchFn.value ? (
          <NSelect
            value={props.value || null}
            onUpdateValue={onChange}
            options={selectOptions.value}
            placeholder={placeholderText.value}
            size={props.formSize}
            filterable
            tag
            clearable
            onFocus={onOpen}
            onScroll={onOpen}
          />
        ) : (
          <NInput
            value={props.value}
            onUpdateValue={(v: string | null) => onChange(v ?? '')}
            placeholder={placeholderText.value}
            size={props.formSize}
          />
        )}
        {props.hint && <div class="mt-2px text-11px text-#999">{props.hint}</div>}
      </div>
    )
  },
})
