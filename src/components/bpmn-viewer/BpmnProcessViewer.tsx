import { defineComponent, ref, watch, onMounted, onBeforeUnmount, type PropType } from 'vue'
import { NButton, NButtonGroup, NIcon } from 'naive-ui'
import NavigatedViewer from 'camunda-bpmn-js/lib/camunda-platform/NavigatedViewer'

function is(element: any, type: string): boolean {
  const bo = (element && element.businessObject) || element
  return bo && typeof bo.$instanceOf === 'function' && bo.$instanceOf(type)
}
import { useCamundaI18n, customTranslateModule } from '../../locales'
import { useCamundaLookups } from '../../composables'
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
    processXml: { type: String, default: '' },
    executionState: { type: Object as PropType<ProcessExecutionState | null>, default: null },
    showTimeline: { type: Boolean, default: false },
    onSearchUsers: { type: Function as PropType<(name: string) => any>, default: null },
    onSearchUserGroups: { type: Function as PropType<(name: string) => any>, default: null },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const { lookups } = useCamundaLookups()

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
          candidateUsers: bo?.candidateUsers?.split(',').map((s: string) => s.trim()) || nodeState?.candidateUsers,
          candidateGroups: bo?.candidateGroups?.split(',').map((s: string) => s.trim()) || nodeState?.candidateGroups,
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
      <div class="relative h-full w-full" style={{ overflow: 'hidden' }}>
        <div
          ref={canvasRef}
          class="h-full w-full"
          style={{ minHeight: '300px' }}
        />

        {props.executionState && (
          <>
            <div class="absolute left-12px top-12px z-10">
              <Legend />
            </div>
            <div class="absolute right-12px bottom-12px z-10">
              <NButtonGroup size="small" vertical>
                <NButton ghost onClick={zoomIn}>
                  <NIcon><span class="i-ic-baseline-add" /></NIcon>
                </NButton>
                <NButton ghost onClick={zoomOut}>
                  <NIcon><span class="i-ic-baseline-remove" /></NIcon>
                </NButton>
                <NButton ghost onClick={fitViewport}>
                  <NIcon><span class="i-ic-baseline-center-focus-strong" /></NIcon>
                </NButton>
              </NButtonGroup>
            </div>

            {props.showTimeline && (
              <div class="absolute right-0 top-0 h-full z-10">
                <TimelinePanel
                  executionState={props.executionState}
                  elementInfoMap={elementInfoMap.value}
                />
              </div>
            )}
          </>
        )}

        <NodeTooltip
          visible={tooltipVisible.value}
          data={tooltipData.value}
          position={tooltipPosition.value}
          onSearchUsers={props.onSearchUsers || lookups.searchUsers}
          onSearchUserGroups={props.onSearchUserGroups || lookups.searchUserGroups}
        />
      </div>
    )
  },
})
