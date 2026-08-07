import { defineComponent, ref, watch, onBeforeUnmount, type PropType } from 'vue'
import { NModal, NButton, NIcon } from 'naive-ui'
import NavigatedViewer from 'camunda-bpmn-js/lib/camunda-platform/NavigatedViewer'
import { CamundaConfigProvider } from '../../config-provider'
import { type ThemeType, type LocaleType } from '../../config-provider/context'
import { useCamundaI18n, customTranslateModule } from '@/locales'
import '../bpmn.css'
import 'camunda-bpmn-js/dist/assets/diagram-js.css'
import 'camunda-bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'

export interface BpmnPreviewModalProps {
  /** 是否显示预览弹窗 */
  show: boolean
  /** BPMN XML 内容 */
  xml?: string
  /** 弹窗标题 */
  title?: string
  /** 主题：light（浅色）/ dark（深色） */
  theme?: ThemeType
  /** 语言：zh-CN / en-US 等 */
  locale?: LocaleType
  /** 弹窗宽度，默认 960px */
  width?: string | number
  /** 画布高度，默认 600px */
  height?: string | number
  /** 弹窗显隐变更回调 */
  onUpdateShow?: (show: boolean) => void
}

export default defineComponent<BpmnPreviewModalProps>({
  name: 'BpmnPreviewModal',
  props: {
    /** 是否显示预览弹窗 */
    show: { type: Boolean, default: false },
    /** BPMN XML 内容 */
    xml: { type: String, default: undefined },
    /** 弹窗标题 */
    title: { type: String, default: '' },
    /** 主题：light（浅色）/ dark（深色） */
    theme: { type: String as PropType<ThemeType>, default: undefined },
    /** 语言：zh-CN / en-US 等 */
    locale: { type: String as PropType<LocaleType>, default: undefined },
    /** 弹窗宽度，默认 960px */
    width: { type: [String, Number] as PropType<string | number>, default: 960 },
    /** 画布高度，默认 600px */
    height: { type: [String, Number] as PropType<string | number>, default: 600 },
    /** 弹窗显隐变更回调 */
    onUpdateShow: { type: Function as PropType<(show: boolean) => void>, default: null },
  },
  emits: ['update:show'],
  setup(props, { emit }) {
    const { t } = useCamundaI18n()

    const currentTheme = ref<ThemeType>(props.theme ?? 'light')
    const currentLocale = ref<LocaleType>(props.locale ?? 'zh-CN')

    watch(
      () => props.theme,
      (val) => {
        if (val) currentTheme.value = val
      },
    )

    const canvasRef = ref<HTMLElement | null>(null)
    let viewer: any = null

    function initViewer() {
      if (!canvasRef.value || viewer) return
      viewer = new NavigatedViewer({
        container: canvasRef.value,
        additionalModules: [customTranslateModule],
      })
    }

    async function loadDiagram(xml: string) {
      if (!viewer || !xml) return
      try {
        await viewer.importXML(xml)
        viewer.get('canvas').zoom('fit-viewport')
      } catch (err) {
        console.error('Failed to preview BPMN XML:', err)
      }
    }

    function zoomIn() {
      if (!viewer) return
      const canvas = viewer.get('canvas')
      const z = canvas.zoom()
      canvas.zoom(Math.min(z * 1.2, 3.0))
    }

    function zoomOut() {
      if (!viewer) return
      const canvas = viewer.get('canvas')
      const z = canvas.zoom()
      canvas.zoom(Math.max(z / 1.2, 0.2))
    }

    function fitViewport() {
      if (!viewer) return
      viewer.get('canvas').zoom('fit-viewport')
    }

    watch(
      () => props.show,
      async (show) => {
        if (show) {
          initViewer()
          await loadDiagram(props.xml || '')
        } else {
          viewer?.get('canvas')?.zoom('fit-viewport')
        }
      },
    )

    watch(
      () => props.xml,
      (xml) => {
        if (xml && props.show) loadDiagram(xml)
      },
    )

    onBeforeUnmount(() => {
      if (viewer) {
        viewer.destroy()
        viewer = null
      }
    })

    function handleUpdateShow(show: boolean) {
      emit('update:show', show)
      props.onUpdateShow?.(show)
    }

    const widthStyle = typeof props.width === 'number' ? `${props.width}px` : props.width
    const heightStyle = typeof props.height === 'number' ? `${props.height}px` : props.height

    return () => (
      <CamundaConfigProvider theme={currentTheme.value} locale={currentLocale.value}>
        {{
          default: () => (
            <NModal
              show={props.show}
              preset="card"
              draggable
              closable
              size="medium"
              style={`width: ${widthStyle}; max-width: 95vw;`}
              title={props.title || t('bpmnPanel.buttons.preview')}
              onUpdateShow={handleUpdateShow}
            >
              {{
                default: () => (
                  <div style="position: relative;">
                    <div
                      ref={canvasRef}
                      class="bpmn-container"
                      style={`height: ${heightStyle}; min-height: 300px;`}
                    />
                    <div
                      class="floating-btn-group"
                      style="position: absolute; top: 8px; right: 8px; z-index: 10; display: flex; gap: 4px;"
                    >
                      <NButton size="small" ghost circle onClick={zoomIn}>
                        <NIcon>
                          <span class="i-ic-baseline-add text-[#409eff]" />
                        </NIcon>
                      </NButton>
                      <NButton size="small" ghost circle onClick={zoomOut}>
                        <NIcon>
                          <span class="i-ic-baseline-remove text-[#409eff]" />
                        </NIcon>
                      </NButton>
                      <NButton size="small" ghost circle onClick={fitViewport}>
                        <NIcon>
                          <span class="i-ic-baseline-center-focus-strong text-[#409eff]" />
                        </NIcon>
                      </NButton>
                    </div>
                  </div>
                ),
              }}
            </NModal>
          ),
        }}
      </CamundaConfigProvider>
    )
  },
})
