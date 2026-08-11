import { defineComponent, computed, type PropType } from 'vue'
import { NTag } from 'naive-ui'
import { useCamundaI18n } from '@/locales'
import { useLint } from '@/composables'
import { useFormSize } from '@/composables'

const severityMap = {
  error: { type: 'error' as const, icon: 'i-ic:baseline-error' },
  warn: { type: 'warning' as const, icon: 'i-ic:baseline-warning' },
  warning: { type: 'warning' as const, icon: 'i-ic:baseline-warning' },
  info: { type: 'info' as const, icon: 'i-ic:baseline-info' },
}

/** 属性面板 Lint Tab 的标签：显示 Lint + 问题数量徽标 */
export const LintTabLabel = defineComponent({
  name: 'LintTabLabel',
  props: {
    // 当前元素的 BPMN 业务对象（BusinessObject），用于匹配 lint 问题
    businessObject: { type: Object as PropType<any>, default: null },
    // bpmn-js 模型器实例，用于读取 linting 服务
    bpmnModeler: { type: Object, default: null },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const { issuesFor } = useLint(() => props.bpmnModeler as any)
    const count = computed(() => issuesFor(props.businessObject?.id).length)
    const hasError = computed(() =>
      issuesFor(props.businessObject?.id).some((i) => i.category === 'error'),
    )

    return () => (
      <span class="inline-flex items-center gap-4px">
        <span>{t('bpmnPanel.tabs.lint')}</span>
        {count.value > 0 && (
          <NTag size="tiny" round type={hasError.value ? 'error' : 'warning'}>
            {count.value}
          </NTag>
        )}
      </span>
    )
  },
})

/** 属性面板的 Lint 内容：展示当前元素的 lint 问题列表 */
export default defineComponent({
  name: 'LintPanel',
  props: {
    // 当前元素的 BPMN 业务对象（BusinessObject），用于匹配 lint 问题
    businessObject: { type: Object as PropType<any>, default: null },
    // 当前选中的 BPMN 图形元素
    element: { type: Object as PropType<any>, default: null },
    // bpmn-js 模型器实例，用于读取 linting 服务
    bpmnModeler: { type: Object, default: null },
    // 表单控件尺寸：small / medium / large
    formSize: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const { labelClass } = useFormSize(() => props.formSize)
    const { issuesFor, lintingActive } = useLint(() => props.bpmnModeler as any)

    const issues = computed(() => issuesFor(props.businessObject?.id))
    const errors = computed(() => issues.value.filter((i) => i.category === 'error').length)
    const warnings = computed(
      () => issues.value.filter((i) => i.category === 'warn' || i.category === 'warning').length,
    )

    /** 按规则名翻译问题消息；无翻译时回退为原始英文消息 */
    function ruleMessage(issue: any): string {
      const key = `bpmnPanel.lint.rules.${issue.rule}`
      const translated = t(key)
      return translated === key ? issue.message : translated
    }

    return () => {
      if (!props.bpmnModeler) {
        return (
          <div class="pt-8px flex items-center gap-8px text-12px text-#888">
            <i class="i-ic:baseline-info text-14px" />
            <span>{t('bpmnPanel.lint.notEnabled')}</span>
          </div>
        )
      }

      const list = issues.value

      return (
        <div class="pt-8px flex flex-col gap-8px">
          {list.length === 0 ? (
            <div class="flex items-center gap-8px text-12px text-#18a058">
              <i class="i-ic:baseline-check-circle text-14px" />
              <span>{t('bpmnPanel.lint.noIssues')}</span>
            </div>
          ) : (
            <>
              <div class="flex items-center gap-8px">
                {errors.value > 0 && (
                  <NTag size="small" type="error">
                    {errors.value} {t('bpmnPanel.lint.error')}
                  </NTag>
                )}
                {warnings.value > 0 && (
                  <NTag size="small" type="warning">
                    {warnings.value} {t('bpmnPanel.lint.warning')}
                  </NTag>
                )}
              </div>
              <div class="flex flex-col gap-8px">
                {list.map((issue, index) => {
                  const sev =
                    severityMap[issue.category as keyof typeof severityMap] || severityMap.info
                  return (
                    <div
                      key={`${issue.rule}-${index}`}
                      class="card-border rounded-6px p-8px flex flex-col gap-4px"
                    >
                      <div class="flex items-center gap-8px">
                        <i
                          class={`${sev.icon} text-14px ${sev.type === 'error' ? 'text-#d03050' : sev.type === 'warning' ? 'text-#f0a020' : 'text-#2080f0'}`}
                        />
                        <span class={`flex-1 ${labelClass.value}`}>{ruleMessage(issue)}</span>
                      </div>
                      <div class="text-11px text-#888 pl-22px">{issue.rule}</div>
                    </div>
                  )
                })}
              </div>
              {!lintingActive.value && (
                <div class="text-11px text-#888">
                  <i class="i-ic:baseline-info mr-4px" />
                  {t('bpmnPanel.lint.inactiveHint')}
                </div>
              )}
            </>
          )}
        </div>
      )
    }
  },
})
