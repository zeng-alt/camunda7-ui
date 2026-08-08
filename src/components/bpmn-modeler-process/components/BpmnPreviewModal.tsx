import {
  defineComponent,
  ref,
  computed,
  watch,
  nextTick,
  onBeforeUnmount,
  type PropType,
  type ComponentPublicInstance,
} from 'vue'
import { NModal, NButton, NIcon, NSpin } from 'naive-ui'
import NavigatedViewer from 'camunda-bpmn-js/lib/camunda-platform/NavigatedViewer'

import { CamundaConfigProvider } from '../../config-provider'
import { type ThemeType, type LocaleType } from '../../config-provider/context'

import { useCamundaI18n, customTranslateModule } from '@/locales'

import '../bpmn.css'

import 'camunda-bpmn-js/dist/assets/diagram-js.css'
import 'camunda-bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'

export interface BpmnPreviewModalProps {
  /** BPMN XML 内容 */
  xml?: string
  /** 弹窗标题 */
  title?: string
  /** 主题：light（浅色）/ dark（深色） */
  theme?: ThemeType
  /** 语言：zh-CN / en-US 等 */
  locale?: LocaleType
  /** 弹窗宽度，默认 800px */
  width?: string | number
  /** 画布高度，默认 600px */
  height?: string | number
}

export default defineComponent<BpmnPreviewModalProps>({
  name: 'BpmnPreviewModal',

  props: {
    xml: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
    },
    theme: {
      type: String as PropType<ThemeType>,
      default: undefined,
    },
    locale: {
      type: String as PropType<LocaleType>,
      default: undefined,
    },
    width: {
      type: [String, Number] as PropType<string | number>,
      default: 800,
    },
    height: {
      type: [String, Number] as PropType<string | number>,
      default: 600,
    },
  },

  emits: ['close'],

  setup(props, { emit, expose }) {
    const { t } = useCamundaI18n()
    /**
     * theme / locale
     */
    const currentTheme = ref<ThemeType>(props.theme ?? 'light')
    const currentLocale = ref<LocaleType>(props.locale ?? 'zh-CN')

    watch(
      () => props.theme,
      (value) => {
        if (value) {
          currentTheme.value = value
        }
      },
    )

    watch(
      () => props.locale,
      (value) => {
        if (value) {
          currentLocale.value = value
        }
      },
    )

    /**
     * viewer
     */
    const canvasRef = ref<HTMLElement | null>(null)
    const visible = ref(false)
    const loading = ref(false)
    let viewer: any = null
    let viewerContainer: HTMLElement | null = null
    let viewerGeneration = 0
    let resizeObserver: ResizeObserver | null = null
    let resizeTimer: number | undefined
    let importChain: Promise<void> = Promise.resolve()
    let loadedXml: string | undefined
    let loadedGen = -1

    /**
     * 画布四周留白（两侧各 24px）
     */
    const PADDING = 48

    /**
     * 导入后按元素实际包围盒计算的画布尺寸。
     * 为 null 时使用 props.width / props.height 兜底。
     */
    const contentSize = ref<{ width: number; height: number } | null>(null)

    /**
     * 销毁当前 viewer
     */
    function destroyViewer() {
      resizeObserver?.disconnect()
      resizeObserver = null

      if (viewer) {
        try {
          viewer.destroy()
        } catch (e) {
          console.warn(e)
        }
        viewer = null
      }
      viewerContainer = null
      loadedXml = undefined
      loadedGen = -1
      contentSize.value = null
      // 旧 viewer 上未完成的导入可能永远不 settle，重置串行链避免阻塞后续加载
      importChain = Promise.resolve()
      viewerGeneration++
    }

    /**
     * 计算当前 diagram 的自然尺寸（单位与画布像素一致，scale = 1）。
     * 取所有元素（含连线折点、标签）的包围盒，跳过根节点。
     */
    function getDiagramSize(viewerInstance: any): { width: number; height: number } | null {
      const elementRegistry = viewerInstance.get('elementRegistry')
      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity

      elementRegistry.getAll().forEach((el: any) => {
        const bo = el.businessObject
        if (
          bo &&
          typeof bo.$instanceOf === 'function' &&
          (bo.$instanceOf('bpmn:Process') || bo.$instanceOf('bpmn:Collaboration'))
        ) {
          return
        }
        if (el.waypoints && el.waypoints.length) {
          el.waypoints.forEach((point: any) => {
            minX = Math.min(minX, point.x)
            minY = Math.min(minY, point.y)
            maxX = Math.max(maxX, point.x)
            maxY = Math.max(maxY, point.y)
          })
          return
        }
        if (typeof el.x === 'number' && typeof el.y === 'number') {
          minX = Math.min(minX, el.x)
          minY = Math.min(minY, el.y)
          maxX = Math.max(maxX, el.x + (el.width ?? 0))
          maxY = Math.max(maxY, el.y + (el.height ?? 0))
        }
      })

      if (minX === Infinity || maxX <= minX || maxY <= minY) {
        return null
      }
      return { width: maxX - minX, height: maxY - minY }
    }

    /**
     * 初始化 bpmn viewer。
     * 弹窗关闭时容器会被卸载，但 viewer 实例仍在；
     * 若 viewer 绑定的容器与当前画布不一致，则重建。
     */
    function initViewer() {
      const el = canvasRef.value
      if (!el) {
        return
      }

      if (viewer && viewerContainer === el) {
        return
      }

      destroyViewer()

      viewer = new NavigatedViewer({
        container: el,
        additionalModules: [customTranslateModule],
      })
      viewerContainer = el

      resizeObserver = new ResizeObserver(() => {
        window.clearTimeout(resizeTimer)

        resizeTimer = window.setTimeout(() => {
          viewer?.get('canvas')?.zoom('fit-viewport')
        }, 100)
      })

      resizeObserver.observe(el)
    }

    /**
     * 加载 XML（串行化，避免并发 import 导致竞态）。
     * 仅当 viewer 绑定当前画布时才执行；结果按代数丢弃，
     * 防止旧 viewer 上未完成的导入影响新 viewer 的状态。
     */
    function loadDiagram(xml?: string) {
      const v = viewer
      if (!v || !xml || viewerContainer !== canvasRef.value) {
        return
      }
      const gen = viewerGeneration
      if (loadedXml === xml && loadedGen === gen) {
        return
      }

      loadedXml = xml
      loadedGen = gen

      importChain = importChain
        .catch(() => {})
        .then(async () => {
          try {
            loading.value = true
            await v.importXML(xml)
            if (gen !== viewerGeneration) {
              return
            }
            contentSize.value = getDiagramSize(v)
            await nextTick()

            v.get('canvas').zoom('fit-viewport')
          } catch (error) {
            if (gen === viewerGeneration) {
              contentSize.value = null
              console.error('[BpmnPreviewModal] importXML error', error)
            }
          } finally {
            if (gen === viewerGeneration) {
              loading.value = false
            }
          }
        })
    }

    /**
     * canvas mounted
     */
    function canvasMounted(el: Element | ComponentPublicInstance | null) {
      canvasRef.value = (el as HTMLElement) || null

      initViewer()

      if (visible.value && props.xml) {
        loadDiagram(props.xml)
      }
    }

    /**
     * zoom
     */
    function zoomIn() {
      if (!viewer) {
        return
      }

      const canvas = viewer.get('canvas')
      const zoom = canvas.zoom()

      canvas.zoom(Math.min(zoom * 1.2, 3))
    }

    function zoomOut() {
      if (!viewer) {
        return
      }

      const canvas = viewer.get('canvas')
      const zoom = canvas.zoom()

      canvas.zoom(Math.max(zoom / 1.2, 0.2))
    }

    function fitViewport() {
      viewer?.get('canvas')?.zoom('fit-viewport')
    }

    /**
     * 打开预览弹窗
     */
    function open(xml?: string) {
      visible.value = true

      // 等待弹窗内容挂载后再初始化 / 加载
      nextTick(() => {
        initViewer()
        const target = xml ?? props.xml
        if (target) {
          loadDiagram(target)
        }
      })
    }

    /**
     * 关闭预览弹窗
     */
    function close() {
      if (!visible.value) {
        return
      }
      visible.value = false
      emit('close')
    }

    /**
     * NModal 内部关闭（X / ESC / 点击遮罩）
     */
    function handleUpdateShow(value: boolean) {
      if (!value) {
        close()
      }
    }

    expose({ open, close })

    /**
     * xml change
     */
    watch(
      () => props.xml,
      (xml) => {
        if (visible.value && xml) {
          loadDiagram(xml)
        }
      },
    )

    /**
     * destroy
     */
    onBeforeUnmount(() => {
      destroyViewer()
    })

    const widthStyle = typeof props.width === 'number' ? `${props.width}px` : props.width
    const heightStyle = typeof props.height === 'number' ? `${props.height}px` : props.height

    /**
     * 弹窗尺寸跟随画布内容：有内容尺寸时用内容尺寸 + 留白，
     * 否则回退到 props.width / props.height，并限制在视口内。
     * 设最小尺寸，保证小图时预览弹窗不会缩得太小。
     */
    const modalStyle = computed(() => {
      const size = contentSize.value
      const width = size ? `${Math.ceil(size.width) + PADDING}px` : widthStyle
      const height = size ? `${Math.ceil(size.height) + PADDING}px` : heightStyle
      return {
        width,
        height,
        minWidth: '640px',
        minHeight: '480px',
        maxWidth: '95vw',
        maxHeight: '95vh',
      }
    })

    return () => (
      <CamundaConfigProvider theme={currentTheme.value} locale={currentLocale.value}>
        <NModal
          show={visible.value}
          preset="card"
          draggable
          closable
          style={modalStyle.value}
          title={props.title || t('bpmnPanel.buttons.preview')}
          onUpdateShow={handleUpdateShow}
        >
          <div
            class="h-full"
            style={{
              position: 'relative',
            }}
          >
            <div ref={canvasMounted} class="bpmn-container h-full" />

            {loading.value && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,.4)',
                  zIndex: 20,
                }}
              >
                <NSpin />
              </div>
            )}

            <div
              class="floating-btn-group"
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                zIndex: 30,
                display: 'flex',
                gap: '4px',
              }}
            >
              <NButton size="small" ghost circle onClick={zoomIn}>
                <NIcon>
                  <span class="i-ic-baseline-add" />
                </NIcon>
              </NButton>

              <NButton size="small" ghost circle onClick={zoomOut}>
                <NIcon>
                  <span class="i-ic-baseline-remove" />
                </NIcon>
              </NButton>

              <NButton size="small" ghost circle onClick={fitViewport}>
                <NIcon>
                  <span class="i-ic-baseline-center-focus-strong" />
                </NIcon>
              </NButton>
            </div>
          </div>
        </NModal>
      </CamundaConfigProvider>
    )
  },
})
