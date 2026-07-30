import { defineComponent } from 'vue'
import { useCamundaI18n } from '../../locales'

export default defineComponent({
  name: 'Legend',
  setup() {
    const { t } = useCamundaI18n()

    const items = [
      { color: '#16a34a', labelKey: 'bpmnViewer.legend.completed' },
      { color: '#2563eb', labelKey: 'bpmnViewer.legend.active' },
      { color: '#f59e0b', labelKey: 'bpmnViewer.legend.rejected' },
    ]

    return () => (
      <div class="flex flex-col gap-4px p-8px bg-#ffffffcc dark:bg-#1a1a1acc rounded-4px shadow-sm border border-solid border-light_border dark:border-dark_border text-12px">
        {items.map((item) => (
          <div class="flex items-center gap-6px whitespace-nowrap">
            <div
              class="w-10px h-10px rounded-50% shrink-0"
              style={{ background: item.color }}
            />
            <span class="text-#333 dark:text-#ccc">{t(item.labelKey)}</span>
          </div>
        ))}
        <div class="flex items-center gap-6px whitespace-nowrap">
          <div class="w-10px h-10px rounded-50% shrink-0 flex items-center justify-center bg-#2563eb text-#fff text-8px font-bold">
            2
          </div>
          <span class="text-#333 dark:text-#ccc">{t('bpmnViewer.legend.visitCount')}</span>
        </div>
        <div class="flex items-center gap-6px whitespace-nowrap">
          <div class="w-10px h-10px rounded-50% shrink-0 flex items-center justify-center bg-#f59e0b text-#fff text-8px font-bold">
            1
          </div>
          <span class="text-#333 dark:text-#ccc">{t('bpmnViewer.legend.rejectCount')}</span>
        </div>
      </div>
    )
  },
})
