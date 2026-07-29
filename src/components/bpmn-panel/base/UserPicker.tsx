import { defineComponent, ref, computed, nextTick, type PropType } from 'vue'
import { useCamundaI18n } from '../../../locales'
import { useCamundaLookups } from '../../../composables'
import type { CamundaLookupItem } from '../../../composables'
import {
  NInput,
  NButton,
  NInputGroup,
  NTag,
  NModal,
  NIcon,
  NDataTable,
  NPagination,
  NEmpty,
} from 'naive-ui'

export default defineComponent({
  name: 'UserPicker',
  props: {
    value: { type: String, default: null },
    multiple: { type: Boolean, default: true },
    formSize: {
      type: String as PropType<'small' | 'medium' | 'large'>,
      default: 'small',
    },
    placeholder: { type: String, default: '' },
    label: { type: String, default: '' },
    hint: { type: String, default: '' },
    allowExpression: { type: Boolean, default: true },
  },
  emits: ['update:value'],
  setup(props, { emit }) {
    const { t } = useCamundaI18n()
    const { lookups } = useCamundaLookups()

    // 模态框相关状态
    const showModal = ref(false)
    const searchKeyword = ref('')
    const currentPage = ref(1)
    const pageSize = ref(20)
    const total = ref(0)
    const users = ref<CamundaLookupItem[]>([])
    const loading = ref(false)
    const selectedInModal = ref<string[]>([])

    // 内嵌输入框相关状态
    const showInput = ref(false)
    const inputValue = ref('')
    const inputRef = ref<InstanceType<typeof NInput> | null>(null)

    const hasSearchFn = computed(() => !!lookups.searchUsers)

    const isExpression = computed(() => {
      if (!props.allowExpression) return false
      if (!props.value) return false
      return /^\$\{.*\}$/.test(props.value)
    })

    const selectedValues = computed(() => {
      if (!props.value) return []
      if (isExpression.value) return []
      return props.value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    })

    const expressionContent = computed(() => {
      if (!props.value) return ''
      return props.value.replace(/^\$\{(.*)\}$/, '$1')
    })

    // 尺寸辅助常量
    const formSizePadding = {
      small: '0 8px',
      medium: '0 10px',
      large: '0 12px',
    }
    const formSizeHeight = {
      small: '28px',
      medium: '34px',
      large: '40px',
    }

    function toggleMode() {
      if (isExpression.value) {
        emit('update:value', '')
      } else {
        emit('update:value', '${}')
      }
    }

    function onExpressionInput(val: string) {
      emit('update:value', val ? '${' + val + '}' : '${}')
    }

    function onDynamicTagsUpdate(val: string[]) {
      emit('update:value', val.join(','))
    }

    // 表格列定义
    const tableColumns = [
      {
        title: '',
        key: 'checked',
        width: 40,
        render: (row: CamundaLookupItem) => (
          <input
            type={props.multiple ? 'checkbox' : 'radio'}
            checked={selectedInModal.value.includes(row.value)}
            onChange={() => toggleRow(row)}
            class="cursor-pointer"
          />
        ),
      },
      { title: t('bpmnPanel.fields.name'), key: 'label' },
      { title: t('bpmnPanel.fields.id'), key: 'value' },
    ]

    // 搜索用户
    async function doSearch(page?: number) {
      if (!lookups.searchUsers) return
      loading.value = true
      try {
        const p = page ?? currentPage.value
        const result = await lookups.searchUsers(searchKeyword.value, p, pageSize.value)
        users.value = result.data
        total.value = result.total
        currentPage.value = result.pageNum
      } finally {
        loading.value = false
      }
    }

    function openModal() {
      selectedInModal.value = [...selectedValues.value]
      searchKeyword.value = ''
      currentPage.value = 1
      showModal.value = true
      doSearch(1)
    }

    function toggleRow(row: CamundaLookupItem) {
      const idx = selectedInModal.value.indexOf(row.value)
      if (idx >= 0) {
        selectedInModal.value.splice(idx, 1)
      } else if (props.multiple) {
        selectedInModal.value.push(row.value)
      } else {
        selectedInModal.value = [row.value]
      }
    }

    function confirmSelection() {
      if (props.multiple) {
        emit('update:value', selectedInModal.value.join(','))
      } else {
        emit('update:value', selectedInModal.value[0] || '')
      }
      showModal.value = false
    }

    function onSearch() {
      currentPage.value = 1
      doSearch(1)
    }

    function onPageChange(page: number) {
      currentPage.value = page
      doSearch(page)
    }

    // 内嵌输入框逻辑
    function showAddInput() {
      showInput.value = true
      nextTick(() => {
        inputRef.value?.focus()
      })
    }

    function addUserFromInput() {
      const val = inputValue.value.trim()
      if (!val) {
        showInput.value = false
        return
      }
      if (!selectedValues.value.includes(val)) {
        onDynamicTagsUpdate([...selectedValues.value, val])
      }
      inputValue.value = ''
      showInput.value = false
    }

    function onInputKeydown(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        e.preventDefault()
        addUserFromInput()
      }
    }

    return () => (
      <div>
        {props.label && <div class="mb-4px text-12px text-#666">{props.label}</div>}

        {/* 根据模式渲染不同的输入区 */}
        {isExpression.value || !props.multiple ? (
          <NInputGroup>
            {props.allowExpression && (
              <NButton
                size={props.formSize}
                type={isExpression.value ? 'default' : 'primary'}
                onClick={toggleMode}
                class="w-[60px]"
              >
                {isExpression.value
                  ? t('bpmnPanel.buttons.variable')
                  : t('bpmnPanel.buttons.fixedValue')}
              </NButton>
            )}
            {isExpression.value ? (
              <NInput
                size={props.formSize}
                value={expressionContent.value}
                onUpdateValue={(val: string | null) => onExpressionInput(val ?? '')}
                placeholder={t('bpmnPanel.placeholders.expression')}
              />
            ) : (
              <NInput
                size={props.formSize}
                value={props.value ?? ''}
                onUpdateValue={(val: string | null) => emit('update:value', val ?? '')}
                placeholder={props.placeholder}
              />
            )}
            {!isExpression.value && hasSearchFn.value && (
              <NButton size={props.formSize} type="primary" ghost onClick={openModal}>
                {{
                  icon: () => (
                    <NIcon>
                      <span class="i-ic-baseline-person text-16px" />
                    </NIcon>
                  ),
                }}
              </NButton>
            )}
          </NInputGroup>
        ) : (
          // 多选模式：自定义标签 + 可选输入框
          <div style={{ display: 'flex', alignItems: 'stretch', width: '100%' }}>
            {props.allowExpression && (
              <NButton
                size={props.formSize}
                type={isExpression.value ? 'default' : 'primary'}
                onClick={toggleMode}
                class="w-[60px]"
                style="border-top-right-radius: 0; border-bottom-right-radius: 0; margin-right: -1px;"
              >
                {isExpression.value
                  ? t('bpmnPanel.buttons.variable')
                  : t('bpmnPanel.buttons.fixedValue')}
              </NButton>
            )}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '4px',
                padding: formSizePadding[props.formSize],
                minHeight: formSizeHeight[props.formSize],
                border: '1px solid var(--n-border-color)',
                borderRadius: props.allowExpression
                  ? '0'
                  : 'var(--n-border-radius) 0 0 var(--n-border-radius)',
                backgroundColor: 'var(--n-color)',
                transition: 'border-color .3s var(--n-bezier)',
              }}
            >
              {selectedValues.value.length === 0 && !showInput.value ? (
                <span class="text-#999">{props.placeholder}</span>
              ) : (
                selectedValues.value.map((val) => (
                  <NTag
                    key={val}
                    closable
                    round
                    size={props.formSize}
                    onClose={() => {
                      const newValues = selectedValues.value.filter((v) => v !== val)
                      onDynamicTagsUpdate(newValues)
                    }}
                    type="primary"
                  >
                    {{
                      icon: () => <i class="i-ic-baseline-person text-[#bd93f9]" />,
                      default: () => val,
                    }}
                  </NTag>
                ))
              )}
              {showInput.value ? (
                <NInput
                  ref={inputRef}
                  size={props.formSize}
                  style={{
                    flex: 1,
                    minWidth: '60px',
                    border: 'none',
                    boxShadow: 'none',
                  }}
                  value={inputValue.value}
                  onUpdateValue={(v: string | null) => {
                    inputValue.value = v ?? ''
                  }}
                  placeholder={t('bpmnPanel.placeholders.enter')}
                  onKeydown={onInputKeydown}
                  onBlur={addUserFromInput}
                />
              ) : (
                <NButton
                  size="tiny"
                  dashed
                  type="primary"
                  onClick={showAddInput}
                  style="margin-left: 4px;"
                >
                  <i class="i-ic-baseline-plus text-16px" />
                </NButton>
              )}
            </div>
            {hasSearchFn.value && (
              <NButton
                size={props.formSize}
                type="primary"
                ghost
                onClick={openModal}
                style={{
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                  marginLeft: '-1px',
                }}
              >
                {{
                  icon: () => (
                    <NIcon>
                      <span class="i-ic-baseline-person text-16px" />
                    </NIcon>
                  ),
                }}
              </NButton>
            )}
          </div>
        )}

        {props.hint && <div class="mt-2px text-11px text-#999">{props.hint}</div>}

        {/* 用户搜索弹窗 */}
        <NModal
          show={showModal.value}
          onUpdateShow={(v: boolean) => {
            showModal.value = v
          }}
          preset="card"
          title={props.label || t('bpmnPanel.fields.userSelection')}
          style="width:600px;max-width:95vw"
          size={props.formSize}
          segmented
        >
          {{
            default: () => (
              <div style="min-height:400px">
                <NInputGroup class="mb-12px">
                  <NInput
                    value={searchKeyword.value}
                    onUpdateValue={(v: string | null) => {
                      searchKeyword.value = v ?? ''
                    }}
                    placeholder={t('bpmnPanel.placeholders.searchUser')}
                    size={props.formSize}
                    clearable
                    onKeydown={(e: KeyboardEvent) => {
                      if (e.key === 'Enter') onSearch()
                    }}
                  />
                  <NButton size={props.formSize} onClick={onSearch}>
                    {t('bpmnPanel.buttons.search')}
                  </NButton>
                </NInputGroup>

                {loading.value ? (
                  <div class="flex items-center justify-center py-40px text-#999">
                    <span class="i-ic-baseline-sync text-20px animate-spin" />
                  </div>
                ) : users.value.length === 0 ? (
                  <NEmpty description={t('bpmnPanel.panel.noData')} />
                ) : (
                  <NDataTable
                    columns={tableColumns}
                    data={users.value}
                    size={props.formSize}
                    striped
                    bordered={false}
                    max-height="300px"
                  />
                )}

                {total.value > pageSize.value && (
                  <div class="flex justify-center mt-12px">
                    <NPagination
                      page={currentPage.value}
                      pageSize={pageSize.value}
                      itemCount={total.value}
                      onUpdatePage={onPageChange}
                      size={props.formSize}
                    />
                  </div>
                )}
              </div>
            ),
            footer: () => (
              <div class="flex justify-end gap-8px">
                <NButton
                  size={props.formSize}
                  onClick={() => {
                    showModal.value = false
                  }}
                >
                  {t('bpmnPanel.buttons.cancel')}
                </NButton>
                <NButton size={props.formSize} type="primary" onClick={confirmSelection}>
                  {t('bpmnPanel.buttons.confirm')}
                </NButton>
              </div>
            ),
          }}
        </NModal>
      </div>
    )
  },
})
