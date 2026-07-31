import { defineComponent, ref, type PropType } from 'vue'
import { NButton, NInput, NModal, NSpace } from 'naive-ui'
import { useCamundaI18n } from '@/locales'

export default defineComponent({
  name: 'ImportExportDialog',
  props: {
    // 是否显示弹窗
    show: { type: Boolean, default: false },
    // 弹窗尺寸
    size: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'small' },
    // XML 文本内容（受控）
    value: { type: String, default: '' },
    // 弹窗显隐变更回调
    onUpdateShow: { type: Function as PropType<(value: boolean) => void>, default: null },
    // XML 文本变更回调
    onUpdateValue: { type: Function as PropType<(value: string) => void>, default: null },
    // 下载 XML 回调
    onDownload: { type: Function as PropType<() => void>, default: null },
    // 保存到模型器回调
    onSaveToModeler: { type: Function as PropType<() => void>, default: null },
  },
  setup(props) {
    const { t } = useCamundaI18n()
    const fileInputRef = ref<HTMLInputElement | null>(null)

    function handleFileImport(event: Event) {
      const target = event.target as HTMLInputElement
      const file = target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (e) => {
        props.onUpdateValue?.(e.target?.result as string)
      }
      reader.readAsText(file)
      target.value = ''
    }

    return () => (
      <NModal
        show={props.show}
        preset="card"
        draggable
        size={props.size}
        style="width: 800px; max-width: 90vw;"
        title={t('bpmnPanel.importExport.title')}
        bordered={false}
        segmented
        closable
        onUpdateShow={props.onUpdateShow}
      >
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <input
            ref={fileInputRef}
            type="file"
            accept=".bpmn,.xml"
            style="display: none;"
            onChange={handleFileImport}
          />
          <NSpace justify="space-between" align="center">
            <NButton size="small" onClick={() => fileInputRef.value?.click()}>
              {t('bpmnPanel.importExport.importFile')}
            </NButton>
          </NSpace>
          <NInput
            type="textarea"
            value={props.value}
            onUpdateValue={(val: string) => props.onUpdateValue?.(val)}
            style="font-family: monospace; font-size: 13px;"
            rows={20}
          />
          <NSpace justify="end">
            <NButton size="small" onClick={props.onDownload}>
              {t('bpmnPanel.importExport.download')}
            </NButton>
            <NButton size="small" type="primary" onClick={props.onSaveToModeler}>
              {t('bpmnPanel.importExport.save')}
            </NButton>
          </NSpace>
        </div>
      </NModal>
    )
  },
})
