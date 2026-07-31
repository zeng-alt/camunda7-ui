import { Fragment, computed, defineComponent, type PropType } from 'vue'
import type { VNode } from 'vue'
import { NTabs } from 'naive-ui'
import type { TabsProps } from 'naive-ui'
import { useCamundaI18n } from '@/locales'
import { useDesignerConfig } from '../designerConfig'

function collectPanes(nodes: VNode[]): VNode[] {
  const result: VNode[] = []
  for (const node of nodes) {
    if (!node || typeof node !== 'object') continue
    if (Array.isArray(node) || node.type === Fragment) {
      const children = Array.isArray(node) ? node : (node.children as VNode[])
      if (Array.isArray(children)) result.push(...collectPanes(children))
    } else if (node.props && typeof node.props.name === 'string') {
      result.push(node)
    }
  }
  return result
}

export default defineComponent({
  name: 'ConfigurableTabs',
  inheritAttrs: false,
  props: {
    // 当前激活的 tab 值（受控模式由父级传入）
    value: {
      type: [String, Number] as PropType<string | number>,
      default: undefined,
    },
    // tab 切换变更回调（受控模式）
    onUpdateValue: {
      type: Function,
      default: null,
    },
    // tab 尺寸
    size: {
      type: String as PropType<TabsProps['size']>,
      default: undefined,
    },
    // tab 类型
    type: {
      type: String as PropType<TabsProps['type']>,
      default: undefined,
    },
  },
  setup(props, { attrs, slots }) {
    const { t } = useCamundaI18n()
    const designerState = useDesignerConfig()

    const hiddenTabs = computed(() => {
      const tabs = designerState.value.tabs
      return new Set(Object.keys(tabs).filter((name) => tabs[name as keyof typeof tabs] === false))
    })
    return () => {
      const raw = slots.default?.() ?? []
      const panes = collectPanes(Array.isArray(raw) ? raw : [raw])
      const visible = panes.filter((vnode) => !hiddenTabs.value.has((vnode as any).props.name))

      if (!visible.length) {
        return (
          <div class="flex items-center justify-center h-full text-#888 text-13px">
            <p>{t('bpmnPanel.panel.noEditableProps')}</p>
          </div>
        )
      }

      const visibleNames = visible.map((vnode) => (vnode as any).props.name)
      let value = props.value
      if (value != null && !visibleNames.includes(value)) {
        value = visibleNames[0]
      }

      return (
        <NTabs
          {...attrs}
          value={value}
          onUpdateValue={props.onUpdateValue as any}
          size={props.size}
          type={props.type}
        >
          {visible}
        </NTabs>
      )
    }
  },
})
