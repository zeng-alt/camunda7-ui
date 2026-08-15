import { defineComponent, ref, computed, watch, nextTick, type PropType } from 'vue'
import { NInput } from 'naive-ui'
import { useCamundaI18n } from '@/locales'

interface SearchItem {
  id: string
  name: string
  type: string
  element: any
}

export default defineComponent({
  name: 'ElementSearchPanel',
  props: {
    // bpmn-js 模型器实例，用于读取元素注册表与定位
    modeler: { type: Object, default: null },
    // 控件尺寸：small / medium / large
    size: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    // 是否显示搜索面板
    show: { type: Boolean, default: false },
    // 显示状态变更回调
    onUpdateShow: { type: Function as PropType<(v: boolean) => void>, default: null },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const keyword = ref('')
    const activeIndex = ref(-1)
    const inputRef = ref<any>(null)

    const results = computed<SearchItem[]>(() => {
      const kw = keyword.value.trim().toLowerCase()
      const modeler = props.modeler
      if (!modeler || !kw) return []
      const registry = modeler.get('elementRegistry')
      const items: SearchItem[] = []
      registry.getAll().forEach((el: any) => {
        if (el.labelTarget) return
        const bo = el.businessObject
        if (!bo) return
        const type: string = bo.$type || ''
        if (type.includes('Process') || type.includes('Collaboration')) return
        const name = bo.name || ''
        const id = el.id || bo.id || ''
        const haystack = `${name} ${id} ${type}`.toLowerCase()
        if (haystack.includes(kw)) {
          items.push({ id, name, type, element: el })
        }
      })
      return items
    })

    watch(
      () => props.show,
      (v) => {
        if (v) {
          keyword.value = ''
          activeIndex.value = -1
          nextTick(() => {
            inputRef.value?.focus?.()
          })
        }
      },
    )

    function flashHighlight(el: any) {
      const modeler = props.modeler
      if (!modeler) return
      const registry = modeler.get('elementRegistry')
      const gfx = registry.getGraphics(el)
      if (!gfx) return
      gfx.classList.add('highlight')
      setTimeout(() => gfx.classList.remove('highlight'), 1600)
    }

    function locate(el: any) {
      const modeler = props.modeler
      if (!modeler || !el) return
      const canvas = modeler.get('canvas')
      const container = canvas.getContainer?.()
      const top = container ? container.clientHeight / 2 : 150
      const left = container ? container.clientWidth / 2 : 200
      canvas.scrollToElement(el, { top, left })
      modeler.get('selection').select(el)
      flashHighlight(el)
      props.onUpdateShow?.(false)
    }

    function onKeydown(e: KeyboardEvent) {
      if (!results.value.length) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        activeIndex.value = (activeIndex.value + 1) % results.value.length
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        activeIndex.value = (activeIndex.value - 1 + results.value.length) % results.value.length
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const idx = activeIndex.value >= 0 ? activeIndex.value : 0
        const item = results.value[idx]
        if (item) locate(item.element)
      } else if (e.key === 'Escape') {
        props.onUpdateShow?.(false)
      }
    }

    function onItemClick(item: SearchItem) {
      locate(item.element)
    }

    function onMouseEnter(index: number) {
      activeIndex.value = index
    }

    return () => {
      if (!props.show) return null
      return (
        <div
          class="absolute top-24px right-72px z-20 w-280px card-border rounded-8px shadow-lg auto-bg"
          style="padding: 8px;"
        >
          <NInput
            ref={inputRef}
            value={keyword.value}
            onUpdateValue={(v: string | null) => {
              keyword.value = v ?? ''
              activeIndex.value = -1
            }}
            onKeydown={onKeydown}
            placeholder={t('bpmnPanel.search.placeholder')}
            size={props.size}
            clearable
          />
          <div class="mt-4px max-h-280px overflow-auto">
            {results.value.length === 0 ? (
              <div class="py-16px text-center text-12px text-#999 dark:text-#777">
                {keyword.value.trim()
                  ? t('bpmnPanel.search.noResults')
                  : t('bpmnPanel.search.emptyHint')}
              </div>
            ) : (
              results.value.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  onMouseenter={() => onMouseEnter(index)}
                  class={`px-8px py-6px rounded-4px cursor-pointer flex items-center gap-8px ${
                    index === activeIndex.value ? 'auto-bg-highlight' : ''
                  }`}
                >
                  <span class="text-12px text-#888 dark:text-#999 flex-1 min-w-0 truncate">
                    {item.name || item.id}
                  </span>
                  <span class="text-11px text-#aaa dark:text-#666 flex-shrink-0">{item.id}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )
    }
  },
})
