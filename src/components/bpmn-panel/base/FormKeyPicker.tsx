import { defineComponent, ref, computed, type PropType } from 'vue'
import { NInput, NSelect } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useCamundaLookups } from '../../../composables'
import type { CamundaLookupItem } from '../../../composables'

export default defineComponent({
  name: 'FormKeyPicker',
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

    const items = ref<CamundaLookupItem[]>([])
    const loaded = ref(false)

    const hasSearchFn = computed(() => !!lookups.searchFormKeys)

    const selectOptions = computed(() =>
      items.value.map((item) => ({
        label: `${item.label} (${item.value})`,
        value: item.value,
      })),
    )

    async function loadItems() {
      if (!lookups.searchFormKeys || loaded.value) return
      try {
        items.value = await lookups.searchFormKeys('')
        loaded.value = true
      } catch {
        items.value = []
      }
    }

    function onOpen() {
      loadItems()
    }

    function onChange(val: string | null) {
      emit('update:value', val ?? '')
    }

    const placeholderText = computed(
      () =>
        props.placeholder ||
        t(
          hasSearchFn.value
            ? 'bpmnPanel.placeholders.searchFormKey'
            : 'bpmnPanel.placeholders.formKey',
        ),
    )

    return () => (
      <div>
        {props.label && <div class="mb-4px text-12px text-#666">{props.label}</div>}
        {hasSearchFn.value ? (
          <NSelect
            value={props.value || null}
            onUpdateValue={onChange}
            options={selectOptions.value}
            placeholder={placeholderText.value}
            size={props.formSize}
            filterable
            clearable
            tag
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
