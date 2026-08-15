import { defineComponent, ref, watch, nextTick, type PropType } from 'vue'
import { NModal, NButton, NInput, NScrollbar } from 'naive-ui'
import { useCamundaI18n } from '@/locales'
import type { AiChatHandler } from '@/ai'

interface UiMessage {
  role: 'user' | 'assistant'
  content: string
  hasXml?: boolean
}

export default defineComponent({
  name: 'AiChatDialog',
  props: {
    // 是否显示对话框
    show: { type: Boolean, default: false },
    // 显示状态变更回调
    onUpdateShow: { type: Function as PropType<(v: boolean) => void>, default: null },
    // bpmn-js 模型器实例
    modeler: { type: Object, default: null },
    // 控件尺寸：small / medium / large
    size: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    // AI 助手回调（必填）
    aiChat: { type: Function as PropType<AiChatHandler>, required: true },
    // 获取当前画布最新 XML
    getXml: { type: Function as PropType<() => Promise<string>>, required: true },
    // 将 XML 应用到画布
    onApplyXml: { type: Function as PropType<(xml: string) => Promise<void>>, required: true },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const messages = ref<UiMessage[]>([])
    const input = ref('')
    const loading = ref(false)
    const error = ref('')
    const pendingXml = ref<string | null>(null)
    const scrollbarRef = ref<any>(null)

    watch(
      () => props.show,
      (v) => {
        if (v) {
          messages.value = []
          input.value = ''
          error.value = ''
          pendingXml.value = null
        }
      },
    )

    function scrollToBottom() {
      nextTick(() => {
        scrollbarRef.value?.scrollTo?.({ top: 999999 })
      })
    }

    async function onSend() {
      const text = input.value.trim()
      if (!text || loading.value) return
      input.value = ''
      error.value = ''
      pendingXml.value = null
      messages.value.push({ role: 'user', content: text })
      loading.value = true
      scrollToBottom()
      try {
        const xml = await props.getXml()
        const result = await props.aiChat(messages.value, xml)
        const normalized = typeof result === 'string' ? { text: result } : result
        const xmlOut = normalized.xml || ''
        messages.value.push({
          role: 'assistant',
          content: normalized.text || (xmlOut ? t('bpmnPanel.ai.generatedXml') : ''),
          hasXml: !!xmlOut,
        })
        pendingXml.value = xmlOut || null
      } catch (err: any) {
        error.value = t('bpmnPanel.ai.error') + (err?.message ? `\n${err.message}` : '')
      } finally {
        loading.value = false
        scrollToBottom()
      }
    }

    async function onApply() {
      if (!pendingXml.value) return
      try {
        await props.onApplyXml(pendingXml.value)
        messages.value.push({ role: 'assistant', content: t('bpmnPanel.ai.applied') })
        pendingXml.value = null
        scrollToBottom()
      } catch (err: any) {
        error.value = t('bpmnPanel.ai.applyError') + (err?.message ? `\n${err.message}` : '')
      }
    }

    return () => (
      <NModal
        show={props.show}
        preset="card"
        title={t('bpmnPanel.ai.title')}
        style="width: 720px"
        onUpdateShow={(v: boolean) => props.onUpdateShow?.(v)}
      >
        <div style="height: 480px; display: flex; flex-direction: column;">
          <NScrollbar ref={scrollbarRef} style="flex: 1;">
            <div class="flex flex-col gap-8px p-8px">
              {messages.value.length === 0 && !loading.value && (
                <div class="py-24px text-center text-12px text-#999">
                  {t('bpmnPanel.ai.emptyHint')}
                </div>
              )}
              {messages.value.map((m, i) => (
                <div key={i} class={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    class={`max-w-85% px-10px py-6px rounded-8px text-12px whitespace-pre-wrap break-words ${
                      m.role === 'user' ? 'bg-#e8f3ff text-#1f2329' : 'auto-bg-highlight'
                    }`}
                  >
                    {m.content}
                    {m.hasXml && (
                      <div class="mt-4px text-11px text-#909399">{t('bpmnPanel.ai.xmlReady')}</div>
                    )}
                  </div>
                </div>
              ))}
              {loading.value && (
                <div class="text-12px text-#909399">{t('bpmnPanel.ai.sending')}</div>
              )}
              {error.value && (
                <div class="text-12px text-#f56c6c whitespace-pre-wrap">{error.value}</div>
              )}
            </div>
          </NScrollbar>
          {pendingXml.value && (
            <div class="flex items-center gap-8px pt-8px mt-8px border-t border-light_border dark:border-dark_border">
              <span class="text-12px text-#1890ff flex-1 min-w-0 truncate">
                {t('bpmnPanel.ai.pendingXml')}
              </span>
              <NButton size={props.size} type="primary" onClick={onApply}>
                {t('bpmnPanel.ai.apply')}
              </NButton>
            </div>
          )}
          <div class="flex items-end gap-8px pt-8px mt-8px border-t border-light_border dark:border-dark_border">
            <NInput
              value={input.value}
              onUpdateValue={(v: string | null) => {
                input.value = v ?? ''
              }}
              onKeydown={(e: KeyboardEvent) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onSend()
                }
              }}
              type="textarea"
              autosize={{ minRows: 2, maxRows: 5 }}
              placeholder={t('bpmnPanel.ai.placeholder')}
              size={props.size}
            />
            <NButton
              type="primary"
              size={props.size}
              loading={loading.value}
              disabled={!input.value.trim()}
              onClick={onSend}
            >
              {t('bpmnPanel.ai.send')}
            </NButton>
          </div>
        </div>
      </NModal>
    )
  },
})
