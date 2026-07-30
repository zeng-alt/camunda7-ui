import { defineComponent, ref, watch, type PropType } from 'vue'
import { useCamundaI18n } from '../../locales'
import type { TooltipData, ExecutionStatus } from './types'

const statusColorMap: Record<ExecutionStatus, string> = {
  active: '#2563eb',
  completed: '#16a34a',
  rejected: '#f59e0b',
  pending: '#9ca3af',
}

export default defineComponent({
  name: 'NodeTooltip',
  props: {
    visible: { type: Boolean, default: false },
    data: { type: Object as PropType<TooltipData | null>, default: null },
    position: { type: Object as PropType<{ x: number; y: number }>, default: () => ({ x: 0, y: 0 }) },
    onSearchUsers: { type: Function as PropType<(name: string) => any>, default: null },
    onSearchUserGroups: { type: Function as PropType<(name: string) => any>, default: null },
  },
  setup(props) {
    const { t } = useCamundaI18n()

    const resolvedUsers = ref<{ value: string; label: string }[]>([])
    const resolvedGroups = ref<{ value: string; label: string }[]>([])

    async function resolveNames() {
      if (!props.data) return
      const d = props.data

      resolvedUsers.value = []
      if (d.candidateUsers && d.candidateUsers.length > 0 && props.onSearchUsers) {
        try {
          const all = await props.onSearchUsers('')
          const items = Array.isArray(all) ? all : all?.data || []
          resolvedUsers.value = d.candidateUsers
            .map((id) => items.find((i: any) => i.value === id))
            .filter(Boolean)
            .map((i: any) => ({ value: i.value, label: i.label }))
        } catch {
          resolvedUsers.value = d.candidateUsers.map((id) => ({ value: id, label: id }))
        }
      } else if (d.candidateUsers) {
        resolvedUsers.value = d.candidateUsers.map((id) => ({ value: id, label: id }))
      }

      resolvedGroups.value = []
      if (d.candidateGroups && d.candidateGroups.length > 0 && props.onSearchUserGroups) {
        try {
          const all = await props.onSearchUserGroups('')
          const items = Array.isArray(all) ? all : []
          resolvedGroups.value = d.candidateGroups
            .map((id) => items.find((i: any) => i.value === id))
            .filter(Boolean)
            .map((i: any) => ({ value: i.value, label: i.label }))
        } catch {
          resolvedGroups.value = d.candidateGroups.map((id) => ({ value: id, label: id }))
        }
      } else if (d.candidateGroups) {
        resolvedGroups.value = d.candidateGroups.map((id) => ({ value: id, label: id }))
      }
    }

    watch(() => props.data, resolveNames, { immediate: true })

    return () => {
      if (!props.visible || !props.data) return null

      const d = props.data
      const statusColor = statusColorMap[d.status]

      return (
        <div
          class="fixed z-1000 pointer-events-none"
          style={{
            left: `${props.position.x}px`,
            top: `${props.position.y}px`,
          }}
        >
          <div
            class="bg-#fff dark:bg-#2a2a2a rounded-6px shadow-lg border border-solid border-#e5e7eb dark:border-#444"
            style={{ width: '260px', fontSize: '12px', lineHeight: '1.5' }}
          >
            <div class="p-8px border-b border-solid border-#e5e7eb dark:border-#444">
              <div class="font-bold text-13px text-#1a1a1a dark:text-#eee truncate">{d.name}</div>
              <div class="text-#888 dark:text-#aaa text-11px mt-2px">{d.type.replace('bpmn:', '')}</div>
            </div>
            <div class="p-8px flex flex-col gap-4px text-#333 dark:text-#ccc">
              <div class="flex items-center gap-6px">
                <div class="w-8px h-8px rounded-50% shrink-0" style={{ background: statusColor }} />
                <span>{t('bpmnViewer.tooltip.status')}: </span>
                <span style={{ color: statusColor }} class="font-medium">
                  {t(`bpmnViewer.tooltip.${d.status}`)}
                </span>
              </div>
              {d.assignee && (
                <div class="flex gap-4px">
                  <span class="text-#888 shrink-0">{t('bpmnViewer.tooltip.assignee')}:</span>
                  <span>{d.assignee}</span>
                </div>
              )}
              {resolvedUsers.value.length > 0 && (
                <div class="flex gap-4px">
                  <span class="text-#888 shrink-0">{t('bpmnViewer.tooltip.candidateUsers')}:</span>
                  <span>{resolvedUsers.value.map((u) => u.label).join(', ')}</span>
                </div>
              )}
              {resolvedGroups.value.length > 0 && (
                <div class="flex gap-4px">
                  <span class="text-#888 shrink-0">{t('bpmnViewer.tooltip.candidateGroups')}:</span>
                  <span>{resolvedGroups.value.map((g) => g.label).join(', ')}</span>
                </div>
              )}
              <div class="flex gap-4px">
                <span class="text-#888 shrink-0">{t('bpmnViewer.tooltip.visitCount')}:</span>
                <span class="font-medium">{d.visitCount}</span>
              </div>
              {d.rejectCount > 0 && (
                <div class="flex gap-4px">
                  <span class="text-#888 shrink-0">{t('bpmnViewer.tooltip.rejectCount')}:</span>
                  <span class="font-medium text-#f59e0b">{d.rejectCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }
  },
})
