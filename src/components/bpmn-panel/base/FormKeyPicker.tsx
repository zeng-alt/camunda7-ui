import { defineComponent, ref, computed, type PropType } from 'vue'
import { NInput, NSelect } from 'naive-ui'
import { useCamundaI18n } from '../../../locales'
import { useCamundaLookups, useFormSize } from '../../../composables'
import type { CamundaLookupItem } from '../../../composables'

export default defineComponent({
  name: 'FormKeyPicker',
  props: {
    // 当前值（受控模式由父级传入）
    value: { type: String, default: '' },
    // 表单控件尺寸：small / medium / large
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    // 输入占位提示
    placeholder: { type: String, default: '' },
    // 表单标签文本
    label: { type: String, default: '' },
    // 提示文本
    hint: { type: String, default: '' },
  },
  emits: ['update:value'],
  setup(props, { emit }) {
    const { t } = useCamundaI18n()
    const { labelClass } = useFormSize(() => props.formSize)
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
        {props.label && <div class={`mb-4px ${labelClass.value}`}>{props.label}</div>}
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
