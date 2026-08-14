import { defineComponent, type PropType } from 'vue'
import { NButton, NButtonGroup, NIcon, NPopconfirm, NPopselect } from 'naive-ui'
import { useCamundaI18n } from '@/locales'
import type { ThemeType, LocaleType, LocaleOption } from '../../config-provider/context'

export default defineComponent({
  name: 'ModelerToolbar',
  props: {
    // 模型器实例，通过 buttons 插槽暴露给外部
    modeler: { type: Object, default: null },
    // 按钮尺寸：small / medium / large
    size: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    // 当前语言
    currentLocale: { type: String as PropType<LocaleType>, default: 'zh-CN' },
    // 语言切换下拉框的可选语言列表
    availableLocales: {
      type: Array as PropType<LocaleOption[]>,
      default: () => [],
    },
    // 当前主题
    currentTheme: { type: String as PropType<ThemeType>, default: 'light' },
    // 语言变更回调
    onLocaleChange: { type: Function as PropType<(value: string) => void>, default: null },
    // 主题切换回调
    onToggleTheme: { type: Function as PropType<() => void>, default: null },
    // 打开元素搜索面板回调
    onSearch: { type: Function as PropType<() => void>, default: null },
    // 放大回调
    onZoomIn: { type: Function as PropType<() => void>, default: null },
    // 缩小回调
    onZoomOut: { type: Function as PropType<() => void>, default: null },
    // 居中回调
    onCenter: { type: Function as PropType<() => void>, default: null },
    // 撤销回调
    onUndo: { type: Function as PropType<() => void>, default: null },
    // 重做回调
    onRedo: { type: Function as PropType<() => void>, default: null },
    // 小地图开关回调
    onToggleMinimap: { type: Function as PropType<() => void>, default: null },
    // 是否启用 Token 仿真（显示开关按钮）
    showTokenSimulation: { type: Boolean, default: true },
    // 当前是否处于 Token 仿真模式
    simulationActive: { type: Boolean, default: false },
    // Token 仿真开关回调
    onToggleSimulation: { type: Function as PropType<() => void>, default: null },
    // 打开导入导出弹窗回调
    onOpenImportExport: { type: Function as PropType<() => void>, default: null },
    // 清空画布回调
    onClear: { type: Function as PropType<() => void>, default: null },
  },
  setup(props, { slots }) {
    const { t } = useCamundaI18n()

    return () => (
      <div
        class="floating-btn-group"
        style="position: absolute; top: 24px; right: 8px; z-index: 10;"
      >
        <NButtonGroup size={props.size}>
          <NButton ghost onClick={props.onSearch}>
            <NIcon>
              <span class="i-ic-baseline-search text-[#409eff]" />
            </NIcon>
          </NButton>
          <NButton ghost onClick={props.onZoomIn}>
            <NIcon>
              <span class="i-ic-baseline-add text-[#409eff]" />
            </NIcon>
          </NButton>
          <NButton ghost onClick={props.onZoomOut}>
            <NIcon>
              <span class="i-ic-baseline-remove text-[#409eff]" />
            </NIcon>
          </NButton>
          <NButton ghost onClick={props.onCenter}>
            <NIcon>
              <span class="i-ic-baseline-center-focus-strong text-[#409eff]" />
            </NIcon>
          </NButton>
          <NButton ghost onClick={props.onUndo}>
            <NIcon>
              <span class="i-ic-baseline-undo text-[#909399]" />
            </NIcon>
          </NButton>
          <NButton ghost onClick={props.onRedo}>
            <NIcon>
              <span class="i-ic-baseline-redo text-[#909399]" />
            </NIcon>
          </NButton>
          <NButton ghost onClick={props.onToggleMinimap}>
            <NIcon>
              <span class="i-ic-baseline-layers text-[#13c2c2]" />
            </NIcon>
          </NButton>
          {props.showTokenSimulation && (
            <NButton ghost onClick={props.onToggleSimulation}>
              <NIcon>
                <span
                  class={
                    props.simulationActive
                      ? 'i-ic-baseline-directions-run text-[#10d070]'
                      : 'i-ic-baseline-directions-run text-[#909399]'
                  }
                />
              </NIcon>
            </NButton>
          )}
          <NButton ghost onClick={props.onOpenImportExport}>
            <NIcon>
              <span class="i-ic-baseline-import-export text-[#e6a23c]" />
            </NIcon>
          </NButton>
          <NPopconfirm
            onPositiveClick={props.onClear}
            positiveText={t('common.confirm')}
            negativeText={t('common.cancel')}
          >
            {{
              default: () => t('bpmnPanel.clearCanvas.confirm'),
              trigger: () => (
                <NButton ghost>
                  <NIcon>
                    <span class="i-ic-baseline-delete text-[#f56c6c]" />
                  </NIcon>
                </NButton>
              ),
            }}
          </NPopconfirm>
          {slots.buttons?.({ modeler: props.modeler })}
          <NPopselect
            value={props.currentLocale}
            options={props.availableLocales as any}
            onUpdateValue={props.onLocaleChange as any}
            trigger="click"
          >
            <NButton ghost>
              <NIcon>
                <span class="i-ic-baseline-language text-[#909399]" />
              </NIcon>
            </NButton>
          </NPopselect>
          <NButton ghost onClick={props.onToggleTheme}>
            <NIcon>
              <span
                class={
                  props.currentTheme === 'dark'
                    ? 'i-ic-baseline-bedtime text-[#b37feb]'
                    : 'i-ic-baseline-wb-sunny text-[#eb2f96]'
                }
              />
            </NIcon>
          </NButton>
        </NButtonGroup>
      </div>
    )
  },
})
