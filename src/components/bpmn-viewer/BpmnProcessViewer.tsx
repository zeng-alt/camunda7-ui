import { defineComponent, ref, watch, onMounted, onBeforeUnmount, type PropType } from 'vue'
import {
  NButton,
  NButtonGroup,
  NIcon,
  NLayout,
  NLayoutContent,
  NLayoutSider,
  NPopselect,
} from 'naive-ui'
import NavigatedViewer from 'camunda-bpmn-js/lib/camunda-platform/NavigatedViewer'
import { CamundaConfigProvider } from '../config-provider'
import { type ThemeType, type LocaleType } from '../config-provider/context'
import type { LocaleOption } from '../config-provider/context'
import { useCamundaI18n, setLocale, customTranslateModule } from '../../locales'
import { useCamundaLookups } from '../../composables'

function is(element: any, type: string): boolean {
  const bo = (element && element.businessObject) || element
  return bo && typeof bo.$instanceOf === 'function' && bo.$instanceOf(type)
}
import Legend from './Legend'
import NodeTooltip from './NodeTooltip'
import TimelinePanel from './TimelinePanel'
import type { ProcessExecutionState, TooltipData } from './types'
import './viewer.css'

import 'camunda-bpmn-js/dist/assets/diagram-js.css'
import 'camunda-bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'

export default defineComponent({
  name: 'BpmnProcessViewer',
  props: {
    theme: { type: String as PropType<ThemeType>, default: undefined },
    locale: { type: String as PropType<LocaleType>, default: undefined },
    localeFallback: { type: String as PropType<LocaleType>, default: undefined },
    localeMessages: {
      type: Object as PropType<Record<string, Record<string, any>>>,
      default: undefined,
    },
    availableLocales: {
      type: Array as PropType<LocaleOption[]>,
      default: () => [
        { label: '中文', value: 'zh-CN' },
        { label: 'English', value: 'en-US' },
      ],
    },
    processXml: { type: String, default: '' },
    executionState: { type: Object as PropType<ProcessExecutionState | null>, default: null },
    showTimeline: { type: Boolean, default: false },
    onSearchUsers: { type: Function as PropType<(name: string) => any>, default: null },
    onSearchUserGroups: { type: Function as PropType<(name: string) => any>, default: null },
  },
  emits: ['update:theme', 'update:locale'],
  setup(props, { emit }) {
    const { t } = useCamundaI18n()
    const { lookups } = useCamundaLookups()

    const currentTheme = ref<ThemeType>(props.theme ?? 'light')
    const currentLocaleRef = ref<LocaleType>(props.locale ?? 'zh-CN')

    const canvasRef = ref<HTMLElement | null>(null)
    let viewer: any = null

    const tooltipVisible = ref(false)
    const tooltipData = ref<TooltipData | null>(null)
    const tooltipPosition = ref({ x: 0, y: 0 })

    const elementInfoMap = ref<Record<string, { name: string; type: string }>>({})

    let tooltipHideTimer: ReturnType<typeof setTimeout> | null = null
    let tooltipElementId: string | null = null

    function clearExecutionMarkers() {
      if (!viewer) return
      const canvas = viewer.get('canvas')
      const elementRegistry = viewer.get('elementRegistry')
      const overlays = viewer.get('overlays')

      elementRegistry.forEach((el: any) => {
        canvas.removeMarker(el, 'execution-completed')
        canvas.removeMarker(el, 'execution-active')
        canvas.removeMarker(el, 'execution-rejected')
      })

      overlays.remove({ type: 'visit' })
      overlays.remove({ type: 'reject' })
      overlays.remove({ type: 'reject-x' })
    }

    function badgeHtml(count: number, cls: string): string {
      return `<div class="execution-badge ${cls}">${count}</div>`
    }

    function applyExecutionState() {
      if (!viewer || !props.executionState) return
      const canvas = viewer.get('canvas')
      const elementRegistry = viewer.get('elementRegistry')
      const overlays = viewer.get('overlays')

      clearExecutionMarkers()

      const state = props.executionState

      for (const [id, ns] of Object.entries(state.elements)) {
        if (ns.status !== 'pending') {
          canvas.addMarker(id, `execution-${ns.status}`)
        }
        if (ns.visitCount > 1) {
          overlays.add(id, 'visit', {
            position: { top: -8, right: -8 },
            html: badgeHtml(ns.visitCount, 'visit-badge'),
          })
        }
        if (ns.rejectCount > 0) {
          overlays.add(id, 'reject', {
            position: { bottom: -8, right: -8 },
            html: badgeHtml(ns.rejectCount, 'reject-badge'),
          })
        }
      }

      for (const [id, fs] of Object.entries(state.sequenceFlows)) {
        if (fs.status !== 'pending') {
          canvas.addMarker(id, `execution-${fs.status}`)
        }
        if (fs.status === 'rejected') {
          const el = elementRegistry.get(id)
          if (el) {
            overlays.add(id, 'reject-x', {
              position: {
                left: (el.width || 50) / 2 - 8,
                top: (el.height || 20) / 2 - 8,
              },
              html: '<div class="reject-x-mark">✕</div>',
            })
          }
        }
      }
    }

    function setupTooltipHandlers() {
      if (!viewer) return
      const eventBus = viewer.get('eventBus')
      const canvas = viewer.get('canvas')

      eventBus.on('element.hover', 1500, (e: any) => {
        const { element, originalEvent } = e
        const bo = element.businessObject

        const hasAssignee =
          is(element, 'bpmn:UserTask') ||
          bo?.assignee ||
          bo?.candidateUsers ||
          bo?.candidateGroups ||
          is(element, 'bpmn:ManualTask')

        if (!hasAssignee) return

        if (tooltipHideTimer) {
          clearTimeout(tooltipHideTimer)
          tooltipHideTimer = null
        }

        tooltipElementId = element.id
        const nodeState = props.executionState?.elements[element.id]

        tooltipData.value = {
          elementId: element.id,
          name: bo?.name || element.id,
          type: bo?.$type || '',
          status: nodeState?.status || 'pending',
          visitCount: nodeState?.visitCount || 1,
          rejectCount: nodeState?.rejectCount || 0,
          assignee: bo?.assignee || nodeState?.assignee,
          candidateUsers:
            bo?.candidateUsers?.split(',').map((s: string) => s.trim()) ||
            nodeState?.candidateUsers,
          candidateGroups:
            bo?.candidateGroups?.split(',').map((s: string) => s.trim()) ||
            nodeState?.candidateGroups,
        }

        const rect = canvas.getContainer().getBoundingClientRect()
        tooltipPosition.value = {
          x: originalEvent.clientX - rect.left + 15,
          y: originalEvent.clientY - rect.top - 10,
        }
        tooltipVisible.value = true
      })

      eventBus.on('element.out', () => {
        tooltipHideTimer = setTimeout(() => {
          tooltipVisible.value = false
          tooltipData.value = null
          tooltipElementId = null
        }, 150)
      })
    }

    function buildElementInfoMap() {
      if (!viewer) return
      const registry = viewer.get('elementRegistry')
      const map: Record<string, { name: string; type: string }> = {}
      registry.forEach((el: any) => {
        const bo = el.businessObject
        if (bo) {
          map[el.id] = {
            name: bo.name || el.id,
            type: bo.$type || '',
          }
        }
      })
      elementInfoMap.value = map
    }

    async function loadDiagram(xml: string) {
      if (!viewer) return
      try {
        await viewer.importXML(xml)
        buildElementInfoMap()
        const canvas = viewer.get('canvas')
        canvas.zoom('fit-viewport')
        applyExecutionState()
      } catch (err) {
        console.error('Failed to import BPMN XML:', err)
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

    function toggleTheme() {
      currentTheme.value = currentTheme.value === 'dark' ? 'light' : 'dark'
      emit('update:theme', currentTheme.value)
    }

    function handleLocaleChange(value: string) {
      currentLocaleRef.value = value as LocaleType
      setLocale(value as LocaleType)
      emit('update:locale', value)
    }

    onMounted(async () => {
      if (!canvasRef.value) return

      viewer = new NavigatedViewer({
        container: canvasRef.value,
        additionalModules: [customTranslateModule],
      })

      setupTooltipHandlers()

      if (props.processXml) {
        await loadDiagram(props.processXml)
      }
    })

    onBeforeUnmount(() => {
      if (viewer) {
        viewer.destroy()
        viewer = null
      }
      if (tooltipHideTimer) {
        clearTimeout(tooltipHideTimer)
      }
    })

    watch(
      () => props.processXml,
      (xml) => {
        if (xml && viewer) loadDiagram(xml)
      },
    )

    watch(
      () => props.executionState,
      () => applyExecutionState(),
      { deep: false },
    )

    return () => (
      <CamundaConfigProvider
        theme={currentTheme.value}
        locale={currentLocaleRef.value}
        localeFallback={props.localeFallback}
        localeMessages={props.localeMessages}
      >
        {{
          default: () => (
            <NLayout has-sider sider-placement="right" position="absolute">
              <NLayoutContent class="h-full" content-style="height: 100%; position: relative;">
                <div
                  ref={canvasRef}
                  class="bpmn-viewer h-full w-full"
                  style={{ minHeight: '300px' }}
                />

                {props.executionState && (
                  <>
                    <div class="absolute left-12px top-12px z-10">
                      <Legend />
                    </div>
                    <div
                      class="floating-btn-group"
                      style="position: absolute; top: 24px; right: 8px; z-index: 10;"
                    >
                      <NButtonGroup size="small">
                        <NButton ghost onClick={zoomIn}>
                          <NIcon>
                            <span class="i-ic-baseline-add text-[#409eff]" />
                          </NIcon>
                        </NButton>
                        <NButton ghost onClick={zoomOut}>
                          <NIcon>
                            <span class="i-ic-baseline-remove text-[#409eff]" />
                          </NIcon>
                        </NButton>
                        <NButton ghost onClick={fitViewport}>
                          <NIcon>
                            <span class="i-ic-baseline-center-focus-strong text-[#409eff]" />
                          </NIcon>
                        </NButton>
                        <NPopselect
                          value={currentLocaleRef.value}
                          options={props.availableLocales as any}
                          onUpdateValue={handleLocaleChange}
                          trigger="click"
                        >
                          <NButton ghost>
                            <NIcon>
                              <span class="i-ic-baseline-language text-[#909399]" />
                            </NIcon>
                          </NButton>
                        </NPopselect>
                        <NButton ghost onClick={toggleTheme}>
                          <NIcon>
                            <span
                              class={
                                currentTheme.value === 'dark'
                                  ? 'i-ic-baseline-bedtime text-[#b37feb]'
                                  : 'i-ic-baseline-wb-sunny text-[#eb2f96]'
                              }
                            />
                          </NIcon>
                        </NButton>
                      </NButtonGroup>
                    </div>
                  </>
                )}

                <NodeTooltip
                  visible={tooltipVisible.value}
                  data={tooltipData.value}
                  position={tooltipPosition.value}
                  onSearchUsers={props.onSearchUsers || lookups.searchUsers}
                  onSearchUserGroups={props.onSearchUserGroups || lookups.searchUserGroups}
                />
              </NLayoutContent>

              {props.showTimeline && props.executionState && (
                <NLayoutSider
                  class="h-full"
                  collapse-mode="width"
                  collapsed-width={0}
                  width={280}
                  native-scrollbar={false}
                  show-trigger="bar"
                  content-style="padding: 0; display: flex; flex-direction: column; height: 100%;"
                  bordered
                >
                  <TimelinePanel
                    executionState={props.executionState}
                    elementInfoMap={elementInfoMap.value}
                  />
                </NLayoutSider>
              )}
            </NLayout>
          ),
        }}
      </CamundaConfigProvider>
    )
  },
})
