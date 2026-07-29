import { defineComponent, ref, computed, type PropType } from 'vue'
import { NInput, NAutoComplete } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useCamundaLookups } from '../../../composables'
import type { CamundaLookupItem } from '../../../composables'

export default defineComponent({
  name: 'DelegateExpressionPicker',
  props: {
    value: { type: String, default: '' },
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    placeholder: { type: String, default: '' },
    label: { type: String, default: '' },
    hint: { type: String, default: '' },
  },
  emits: ['update:value'],
  setup(props, { emit }) {
    const { t } = useCamundaI18n()
    const { lookups } = useCamundaLookups()

    const searchResults = ref<CamundaLookupItem[]>([])
    let searchTimer: ReturnType<typeof setTimeout> | null = null

    const hasSearchFn = computed(() => !!lookups.searchDelegateExpressions)

    const autoCompleteOptions = computed(() =>
      searchResults.value.map((item) => ({
        label: `${item.label} (${item.value})`,
        value: item.value,
      })),
    )

    function onChange(val: string) {
      emit('update:value', val)
    }

    function onSearch(query: string) {
      if (!lookups.searchDelegateExpressions) return
      if (searchTimer) clearTimeout(searchTimer)
      if (!query) {
        searchResults.value = []
        return
      }
      searchTimer = setTimeout(async () => {
        try {
          searchResults.value = await lookups.searchDelegateExpressions!(query)
        } catch {
          searchResults.value = []
        }
      }, 200)
    }

    const placeholder = computed(
      () =>
        props.placeholder ||
        t(
          hasSearchFn.value
            ? 'bpmnPanel.placeholders.searchDelegateExpression'
            : 'bpmnPanel.placeholders.listenerDelegateExpression',
        ),
    )

    return () => (
      <div>
        {props.label && <div class="mb-4px text-12px text-#666">{props.label}</div>}
        {hasSearchFn.value ? (
          <NAutoComplete
            value={props.value}
            onUpdateValue={onChange}
            options={autoCompleteOptions.value}
            onInput={onSearch}
            placeholder={placeholder.value}
            size={props.formSize}
            clearable
          />
        ) : (
          <NInput
            value={props.value}
            onUpdateValue={(v: string | null) => onChange(v ?? '')}
            placeholder={placeholder.value}
            size={props.formSize}
          />
        )}
        {props.hint && <div class="mt-2px text-11px text-#999">{props.hint}</div>}
      </div>
    )
  },
})
