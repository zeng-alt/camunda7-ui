import { defineComponent, type PropType, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { CamundaConfigProvider } from '../config-provider'
import { type ThemeType, type LocaleType } from '../config-provider/context'
import { useCamundaI18n, setLocale, customTranslateModule } from '@/locales'
import { useCamundaLookups } from '@/composables'
import { useMessage } from 'naive-ui'
import {
  resolveDesignerConfig,
  provideDesignerConfig,
  type DesignerConfig,
  type ElementKey,
} from '../bpmn-panel/designerConfig'
import createConfigurableNodesModule from './features/configurable-nodes/createConfigurableNodesModule'
import {
  NButton,
  NButtonGroup,
  NIcon,
  NLayout,
  NLayoutContent,
  NLayoutSider,
  NPopselect,
  NModal,
  NInput,
  NSpace,
  NPopconfirm,
} from 'naive-ui'
import type { PageResult, CamundaLookupItem, ProcessLookupItem } from '@/composables'
import type { LocaleOption } from '../config-provider/context'
import CamundaPropertiesPanel from '../bpmn-panel/CamundaPropertiesPanel'
import './bpmn.css'
import BpmnModeler from 'camunda-bpmn-js/lib/camunda-platform/Modeler'
import 'camunda-bpmn-js/dist/assets/camunda-platform-modeler.css'
import 'camunda-bpmn-js/dist/assets/diagram-js.css'
import 'camunda-bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'
import 'camunda-bpmn-js/dist/assets/bpmn-js.css'

const processId = `Process_${Math.random().toString(36).slice(2, 9)}`

const someDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:camunda="http://camunda.org/schema/1.0/bpmn" xmlns:modeler="http://camunda.org/schema/modeler/1.0" id="Definitions_0pw1fh7" targetNamespace="http://bpmn.io/schema/bpmn" exporter="Camunda Modeler" exporterVersion="5.37.0" modeler:executionPlatform="Camunda Platform" modeler:executionPlatformVersion="7.23.0">
  <bpmn:process id="${processId}" isExecutable="true" camunda:historyTimeToLive="180">
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${processId}">
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`

export const bpmnModelerProcessProps = {
  // 主题：light（浅色）/ dark（深色）
  theme: {
    type: String as PropType<ThemeType>,
    default: undefined,
  },
  // 语言：zh-CN / en-US 等，支持的语言列表见 availableLocales
  locale: {
    type: String as PropType<LocaleType>,
    default: undefined,
  },
  // 语言回退：当前语言缺少翻译时使用的兜底语言
  localeFallback: {
    type: String as PropType<LocaleType>,
    default: undefined,
  },
  // 自定义语言包：按语言聚合的翻译键值，可覆盖内置文案
  localeMessages: {
    type: Object as PropType<Record<string, Record<string, any>>>,
    default: undefined,
  },
  // 语言切换下拉框的可选语言列表
  availableLocales: {
    type: Array as PropType<LocaleOption[]>,
    default: () => [
      { label: '中文', value: 'zh-CN' },
      { label: 'English', value: 'en-US' },
    ],
  },
  // BPMN XML 内容，传入后自动导入到画布
  xml: {
    type: String,
    default: undefined,
  },
  // 是否专业模式：true 显示全部节点与属性，false 为受限模式（按 designerConfig 隐藏）
  proDesigner: {
    type: Boolean,
    default: true,
  },
  // 设计器配置：限制模式下隐藏的节点（大类 + 事件定义变体）与属性 tab
  designerConfig: {
    type: Object as PropType<DesignerConfig>,
    default: undefined,
  },
  // 是否自动把 XML 暂存到 localStorage（用于刷新恢复）
  autoStash: {
    type: Boolean,
    default: true,
  },
  // 暂存 XML 使用的 localStorage 键名
  stashKey: {
    type: String,
    default: 'camunda7-ui:stash:xml',
  },
  // 属性面板表单尺寸：small / medium / large
  size: {
    type: String as PropType<'small' | 'medium' | 'large'>,
    default: 'small',
  },
  // 额外 tab 的标签文本映射：{ 元素类型: 自定义标签 }
  extraTabLabels: {
    type: Object as PropType<Record<string, string>>,
    default: () => ({}),
  },
  // 保存回调：点击保存时把最新 XML 交给外部
  onSaveXml: {
    type: Function as PropType<(xml: string) => void>,
    default: null,
  },
  // 搜索用户回调：按关键字分页搜索用户
  onSearchUsers: {
    type: Function as PropType<
      (name: string, pageNo?: number, pageSize?: number) => PageResult | Promise<PageResult>
    >,
    default: null,
  },
  // 搜索用户组回调：按关键字搜索用户组
  onSearchUserGroups: {
    type: Function as PropType<
      (name: string) => CamundaLookupItem[] | Promise<CamundaLookupItem[]>
    >,
    default: null,
  },
  // 获取流程定义列表回调：用于调用活动/决策等选择流程
  onFetchProcessList: {
    type: Function as PropType<() => ProcessLookupItem[] | Promise<ProcessLookupItem[]>>,
    default: null,
  },
  // 搜索 Java 类回调：用于实现类（class）选择
  onSearchJavaClasses: {
    type: Function as PropType<
      (name: string) => CamundaLookupItem[] | Promise<CamundaLookupItem[]>
    >,
    default: null,
  },
  // 搜索委托表达式回调：用于 delegateExpression 选择
  onSearchDelegateExpressions: {
    type: Function as PropType<
      (name: string) => CamundaLookupItem[] | Promise<CamundaLookupItem[]>
    >,
    default: null,
  },
  // 搜索外部任务主题回调：用于外部任务（External Task）topic 选择
  onSearchExternalTopics: {
    type: Function as PropType<
      (name: string) => CamundaLookupItem[] | Promise<CamundaLookupItem[]>
    >,
    default: null,
  },
  // 用户解析器表达式：用于解析办理人/候选人的 JS 表达式
  userResolver: {
    type: String,
    default: 'approverResolver.getUsers',
  },
  // 用户组解析器表达式：用于解析候选用户组的 JS 表达式
  groupResolver: {
    type: String,
    default: 'approverResolver.getUserGroups',
  },
  // 搜索决策引用回调：用于业务规则任务选择 DMN 决策
  onSearchDecisionRefs: {
    type: Function as PropType<
      (name: string) => ProcessLookupItem[] | Promise<ProcessLookupItem[]>
    >,
    default: null,
  },
  // 搜索表单引用回调：用于表单引用（Camunda Forms / 外部表单）选择
  onSearchFormRefs: {
    type: Function as PropType<
      (name: string) => ProcessLookupItem[] | Promise<ProcessLookupItem[]>
    >,
    default: null,
  },
  // 搜索表单 Key 回调：用于表单 Key 选择
  onSearchFormKeys: {
    type: Function as PropType<
      (name: string) => CamundaLookupItem[] | Promise<CamundaLookupItem[]>
    >,
    default: null,
  },
}

export default defineComponent({
  name: 'BpmnModelerProcessContent',
  props: { ...bpmnModelerProcessProps },
  emits: ['update:theme', 'update:locale'],
  setup(props, { emit, slots }) {
    const message = useMessage()
    const { t, currentLocale } = useCamundaI18n()

    const designerState = ref(
      resolveDesignerConfig(props.proDesigner ?? true, props.designerConfig),
    )
    provideDesignerConfig(designerState)

    const nodesModule = createConfigurableNodesModule({
      isElementVisible: (type: string, eventDefinitionType?: string) => {
        const elements = designerState.value.elements
        if (elements[type as ElementKey] === false) return false
        if (eventDefinitionType) {
          return elements[`${type}#${eventDefinitionType}` as ElementKey] !== false
        }
        return elements[`${type}#none` as ElementKey] !== false
      },
    })

    watch(
      [() => props.proDesigner, () => props.designerConfig],
      () => {
        designerState.value = resolveDesignerConfig(props.proDesigner ?? true, props.designerConfig)
        if (bpmnModeler) {
          bpmnModeler.get('eventBus')?.fire('i18n.changed')
        }
      },
      { deep: true },
    )

    const currentTheme = ref<ThemeType>(props.theme ?? 'light')
    const currentLocaleRef = ref<LocaleType>(props.locale ?? currentLocale.value ?? 'zh-CN')

    const canvasRef = ref<HTMLElement | null>(null)
    const modelerRef = ref<any>(null)
    let bpmnModeler: any = null
    let stashTimer: ReturnType<typeof setTimeout> | null = null
    let latestXml = ''

    async function loadDiagram(xmlStr: string) {
      if (!bpmnModeler) return
      try {
        await bpmnModeler.importXML(xmlStr)
        setupColorManager(bpmnModeler)
        let attempts = 0
        const tryFitViewport = () => {
          if (
            canvasRef.value &&
            canvasRef.value.clientWidth > 0 &&
            canvasRef.value.clientHeight > 0
          ) {
            bpmnModeler.get('canvas').zoom('fit-viewport')
          } else if (attempts < 10) {
            attempts++
            setTimeout(tryFitViewport, 50)
          }
        }
        tryFitViewport()
      } catch (err) {
        console.error('something went wrong:', err)
      }
    }

    function doStash() {
      if (!bpmnModeler || !props.autoStash) return
      bpmnModeler
        .saveXML({ format: true })
        .then(({ xml }: any) => {
          latestXml = xml
          try {
            localStorage.setItem(props.stashKey, xml)
          } catch {
            // storage full or unavailable
          }
        })
        .catch(() => {})
    }

    function debounceStash() {
      if (!props.autoStash) return
      if (stashTimer) clearTimeout(stashTimer)
      stashTimer = setTimeout(doStash, 2000)
    }

    function checkStash() {
      if (props.xml || !props.autoStash) return
      try {
        const stashed = localStorage.getItem(props.stashKey)
        if (stashed) {
          pendingStashXml.value = stashed
          showRestoreDialog.value = true
        }
      } catch {
        // ignore
      }
    }

    function handleRestoreStash() {
      showRestoreDialog.value = false
      if (pendingStashXml.value && bpmnModeler) {
        latestXml = pendingStashXml.value
        loadDiagram(pendingStashXml.value)
      }
      pendingStashXml.value = ''
    }

    function handleDiscardStash() {
      showRestoreDialog.value = false
      pendingStashXml.value = ''
    }

    onMounted(async () => {
      if (canvasRef.value) {
        bpmnModeler = new BpmnModeler({
          container: canvasRef.value,
          additionalModules: [customTranslateModule, nodesModule],
        })
        modelerRef.value = bpmnModeler

        const initialXml = props.xml || someDiagram
        await loadDiagram(initialXml)

        checkStash()

        if (props.autoStash) {
          bpmnModeler.on('element.changed', debounceStash)
          bpmnModeler.on('commandStack.changed', debounceStash)
        }
      }
    })

    watch(
      () => props.xml,
      (newXml) => {
        if (newXml && bpmnModeler) {
          loadDiagram(newXml)
        }
      },
    )

    onBeforeUnmount(() => {
      doStash()
      if (latestXml) {
        try {
          localStorage.setItem(props.stashKey, latestXml)
        } catch {
          // storage full or unavailable
        }
      }
      if (stashTimer) clearTimeout(stashTimer)
      if (bpmnModeler) {
        bpmnModeler.destroy()
      }
    })

    function toggleMinimap() {
      if (bpmnModeler) {
        const minimap = bpmnModeler.get('minimap')
        if (minimap) minimap.toggle()
      }
    }

    function zoomIn() {
      if (bpmnModeler) {
        const canvas = bpmnModeler.get('canvas')
        const currentZoom = canvas.zoom()
        canvas.zoom(Math.min(currentZoom * 1.2, 3.0), 'auto')
      }
    }

    function zoomOut() {
      if (bpmnModeler) {
        const canvas = bpmnModeler.get('canvas')
        const currentZoom = canvas.zoom()
        canvas.zoom(Math.max(currentZoom / 1.2, 0.2), 'auto')
      }
    }

    function centerView() {
      if (bpmnModeler) {
        const canvas = bpmnModeler.get('canvas')
        canvas.zoom('fit-viewport')
      }
    }

    function lastStep() {
      if (bpmnModeler) {
        const commandStack = bpmnModeler.get('commandStack')
        if (commandStack.canUndo()) commandStack.undo()
      }
    }

    function nextStep() {
      if (bpmnModeler) {
        const commandStack = bpmnModeler.get('commandStack')
        if (commandStack.canRedo()) commandStack.redo()
      }
    }

    const showExportDialog = ref(false)
    const showRestoreDialog = ref(false)
    const pendingStashXml = ref('')
    const exportXml = ref('')
    const fileInputRef = ref<HTMLInputElement | null>(null)

    async function openImportExportDialog() {
      if (bpmnModeler) {
        try {
          const { xml } = await bpmnModeler.saveXML({ format: true })
          exportXml.value = xml
          showExportDialog.value = true
        } catch (err: any) {
          message.error(t('bpmnPanel.importExport.exportError') + '\n' + (err.message || err))
        }
      }
    }

    function downloadXml() {
      const blob = new Blob([exportXml.value], { type: 'text/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'diagram.bpmn'
      a.click()
      URL.revokeObjectURL(url)
    }

    async function saveXmlToModeler() {
      if (bpmnModeler) {
        try {
          await bpmnModeler.importXML(exportXml.value)
          const canvas = bpmnModeler.get('canvas')
          canvas.zoom('fit-viewport')
          showExportDialog.value = false
        } catch (err: any) {
          message.error(t('bpmnPanel.importExport.importError') + '\n' + (err.message || err))
          console.error('Error importing XML', err)
        }
      }
    }

    function handleFileImport(event: Event) {
      const target = event.target as HTMLInputElement
      const file = target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (e) => {
        exportXml.value = e.target?.result as string
      }
      reader.readAsText(file)
      target.value = ''
    }

    function setupColorManager(modeler: any) {
      const elementRegistry = modeler.get('elementRegistry')
      elementRegistry.forEach((el: any) => reapplyElementColor(modeler, el))
      modeler.on('element.changed', ({ element }: any) => reapplyElementColor(modeler, element))
    }

    function reapplyElementColor(modeler: any, element: any) {
      const di = element.di
      if (!di) return
      const fill = di.get('color:background-color') || di.get('bioc:fill') || (di as any).fill
      const stroke = di.get('color:border-color') || di.get('bioc:stroke') || (di as any).stroke
      if (!fill && !stroke) return
      const elementRegistry = modeler.get('elementRegistry')
      const gfx = elementRegistry.getGraphics(element) as SVGElement | null
      if (!gfx) return
      const sel = '.djs-visual > :is(rect, circle, polygon, ellipse, path)'
      const visual = gfx.querySelector(sel) as SVGElement | null
      if (visual) {
        if (fill) visual.style.setProperty('fill', fill, 'important')
        if (stroke) visual.style.setProperty('stroke', stroke, 'important')
      }
    }

    async function clearCanvas() {
      if (!bpmnModeler) return
      try {
        await bpmnModeler.importXML(someDiagram)
        const canvas = bpmnModeler.get('canvas')
        canvas.zoom('fit-viewport')
      } catch (err) {
        console.error('Error clearing canvas', err)
      }
    }

    function toggleTheme() {
      currentTheme.value = currentTheme.value === 'dark' ? 'light' : 'dark'
      emit('update:theme', currentTheme.value)
    }

    function handleLocaleChange(value: string) {
      currentLocaleRef.value = value as LocaleType
      setLocale(value as LocaleType)
      emit('update:locale', value)
      bpmnModeler?.get('eventBus')?.fire('i18n.changed')
    }

    const { registerLookups } = useCamundaLookups()
    registerLookups({
      searchUsers: props.onSearchUsers,
      searchUserGroups: props.onSearchUserGroups,
      fetchProcessList: props.onFetchProcessList,
      searchJavaClasses: props.onSearchJavaClasses,
      searchDelegateExpressions: props.onSearchDelegateExpressions,
      searchExternalTopics: props.onSearchExternalTopics,
      searchDecisionRefs: props.onSearchDecisionRefs,
      searchFormRefs: props.onSearchFormRefs,
      searchFormKeys: props.onSearchFormKeys,
    })

    const extraTabs: Record<string, any> = {
      'start-event': slots['start-event-extra'],
      'end-event': slots['end-event-extra'],
      'intermediate-throw-event': slots['intermediate-throw-event-extra'],
      'intermediate-catch-event': slots['intermediate-catch-event-extra'],
      task: slots['task-extra'],
      gateway: slots['gateway-extra'],
    }

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
              <NLayoutContent
                class="h-full"
                content-style="height: 100%; display: flex; flex-direction: column;"
              >
                <div ref={canvasRef} class="bpmn-container" style="flex: 1; min-height: 0;" />
                {slots.footer && (
                  <div class="absolute bottom-12px left-1/2 -translate-x-1/2 z-10">
                    {slots.footer()}
                  </div>
                )}
                <div
                  class="floating-btn-group"
                  style="position: absolute; top: 24px; right: 8px; z-index: 10;"
                >
                  <NButtonGroup size={props.size}>
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
                    <NButton ghost onClick={centerView}>
                      <NIcon>
                        <span class="i-ic-baseline-center-focus-strong text-[#409eff]" />
                      </NIcon>
                    </NButton>
                    <NButton ghost onClick={lastStep}>
                      <NIcon>
                        <span class="i-ic-baseline-undo text-[#909399]" />
                      </NIcon>
                    </NButton>
                    <NButton ghost onClick={nextStep}>
                      <NIcon>
                        <span class="i-ic-baseline-redo text-[#909399]" />
                      </NIcon>
                    </NButton>
                    <NButton ghost onClick={toggleMinimap}>
                      <NIcon>
                        <span class="i-ic-baseline-layers text-[#13c2c2]" />
                      </NIcon>
                    </NButton>
                    <NButton ghost onClick={openImportExportDialog}>
                      <NIcon>
                        <span class="i-ic-baseline-import-export text-[#e6a23c]" />
                      </NIcon>
                    </NButton>
                    <NPopconfirm
                      onPositiveClick={clearCanvas}
                      positiveText={t('common.confirm')}
                      negativeText={t('common.cancel')}
                    >
                      {{
                        default: () => t('bpmnPanel.clearCanvas.confirm'),
                        trigger: () => (
                          <NButton ghost>
                            <NIcon>
                              <span class="i-ic-baseline-delete text-[#f56c6c]" />
                            </NIcon>
                          </NButton>
                        ),
                      }}
                    </NPopconfirm>
                    {slots.buttons?.({ modeler: modelerRef.value })}
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
                <NModal
                  show={showExportDialog.value}
                  preset="card"
                  draggable
                  size={props.size}
                  style="width: 800px; max-width: 90vw;"
                  title={t('bpmnPanel.importExport.title')}
                  bordered={false}
                  segmented
                  closable
                  onUpdateShow={(val: boolean) => {
                    showExportDialog.value = val
                  }}
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
                      value={exportXml.value}
                      onUpdateValue={(val: string) => {
                        exportXml.value = val
                      }}
                      style="font-family: monospace; font-size: 13px;"
                      rows={20}
                    />
                    <NSpace justify="end">
                      <NButton size="small" onClick={downloadXml}>
                        {t('bpmnPanel.importExport.download')}
                      </NButton>
                      <NButton size="small" type="primary" onClick={saveXmlToModeler}>
                        {t('bpmnPanel.importExport.save')}
                      </NButton>
                    </NSpace>
                  </div>
                </NModal>
                <NModal
                  show={showRestoreDialog.value}
                  preset="dialog"
                  mask-closable={false}
                  size={props.size}
                  style="width: 420px;"
                  title={t('bpmnPanel.autoStash.restore')}
                  positiveText={t('common.confirm')}
                  negativeText={t('common.cancel')}
                  onPositiveClick={handleRestoreStash}
                  onNegativeClick={handleDiscardStash}
                  onUpdateShow={(val: boolean) => {
                    showRestoreDialog.value = val
                  }}
                  bordered={false}
                />
              </NLayoutContent>
              <NLayoutSider
                class="h-full"
                collapse-mode="width"
                collapsed-width={0}
                width={450}
                native-scrollbar={false}
                show-trigger="bar"
                content-style="padding: 0; display: flex; flex-direction: column; height: 100%;"
                bordered
              >
                <CamundaPropertiesPanel
                  bpmnModeler={modelerRef.value}
                  formSize={props.size}
                  extraTabs={extraTabs}
                  extraTabLabels={props.extraTabLabels}
                  userResolver={props.userResolver}
                  groupResolver={props.groupResolver}
                />
              </NLayoutSider>
            </NLayout>
          ),
        }}
      </CamundaConfigProvider>
    )
  },
})
