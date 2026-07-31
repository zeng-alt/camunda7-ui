import { computed, defineComponent, type PropType } from 'vue'
import type { VNode } from 'vue'
import { NTabs } from 'naive-ui'
import type { TabsProps } from 'naive-ui'
import { useCamundaI18n } from '@/locales'
import { useDesignerConfig } from '../designerConfig'

export default defineComponent({
  name: 'ConfigurableTabs',
  inheritAttrs: false,
  props: {
    value: {
      type: [String, Number] as PropType<string | number>,
      default: undefined,
    },
    onUpdateValue: {
      type: Function,
      default: null,
    },
    size: {
      type: String as PropType<TabsProps['size']>,
      default: undefined,
    },
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
      const children = (slots.default?.() ?? []).flat(Infinity) as VNode[]
      const panes = children.filter(
        (vnode) =>
          vnode &&
          typeof vnode === 'object' &&
          (vnode as any).props &&
          typeof (vnode as any).props.name === 'string',
      )
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
