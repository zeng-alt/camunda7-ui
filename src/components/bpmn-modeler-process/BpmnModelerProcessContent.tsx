import {
  defineComponent,
  type PropType,
  onMounted,
  onBeforeUnmount,
  ref,
  watch,
  getCurrentInstance,
} from 'vue'
import { CamundaConfigProvider } from '../config-provider'
import type { ValidateResult, LintReport } from '@/lint'
import { type ThemeType, type LocaleType } from '../config-provider/context'
import { useCamundaI18n, setLocale, customTranslateModule } from '@/locales'
import { useMessage } from 'naive-ui'
import { NLayout, NLayoutContent, NLayoutSider } from 'naive-ui'
import {
  resolveDesignerConfig,
  provideDesignerConfig,
  type DesignerConfig,
  type ElementKey,
} from '../bpmn-panel/designerConfig'
import createConfigurableNodesModule from './features/configurable-nodes/createConfigurableNodesModule'
import { toElementKey, getElementTypeFromBo, type ActionTarget } from '@/utils/bpmn'
import type { PageResult, CamundaLookupItem, ProcessLookupItem } from '@/composables'
import type { LocaleOption } from '../config-provider/context'
import CamundaPropertiesPanel from '../bpmn-panel/CamundaPropertiesPanel'
import {
  useBpmnModeler,
  useXmlStash,
  zoomIn,
  zoomOut,
  centerView,
  undo,
  redo,
  toggleMinimap,
  toggleTokenSimulation,
} from './composables'
import TokenSimulationModule from 'bpmn-js-token-simulation'
import SimulationSupportModule from 'bpmn-js-token-simulation/lib/simulation-support'
import {
  ModelerToolbar,
  DesignerSwitch,
  ImportExportDialog,
  RestoreStashDialog,
  ElementSearchPanel,
  AiChatDialog,
} from './components'
import type { AiChatHandler } from '@/ai'
import './bpmn.css'
import 'camunda-bpmn-js/dist/assets/camunda-platform-modeler.css'
import 'camunda-bpmn-js/dist/assets/diagram-js.css'
import 'camunda-bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'
import 'camunda-bpmn-js/dist/assets/bpmn-js.css'
import 'bpmn-js-bpmnlint/dist/assets/css/bpmn-js-bpmnlint.css'
import 'bpmn-js-token-simulation/assets/css/bpmn-js-token-simulation.css'

const processId = `Process_${Math.random().toString(36).slice(2, 9)}`

const defaultDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:camunda="http://camunda.org/schema/1.0/bpmn" xmlns:modeler="http://camunda.org/schema/modeler/1.0" id="Definitions_0pw1fh7" targetNamespace="http://bpmn.io/schema/bpmn" exporter="Camunda Modeler" exporterVersion="5.37.0" modeler:executionPlatform="Camunda Platform" modeler:executionPlatformVersion="7.23.0">
  <bpmn:process id="${processId}" isExecutable="true" camunda:historyTimeToLive="180">
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${processId}">
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`

export interface BpmnModelerProcessProps {
  /** 主题：light（浅色）/ dark（深色） */
  theme?: ThemeType
  /** 语言：zh-CN / en-US 等，支持的语言列表见 availableLocales */
  locale?: LocaleType
  /** 语言回退：当前语言缺少翻译时使用的兜底语言 */
  localeFallback?: LocaleType
  /** 自定义语言包：按语言聚合的翻译键值，可覆盖内置文案 */
  localeMessages?: Record<string, Record<string, any>>
  /** 语言切换下拉框的可选语言列表 */
  availableLocales?: LocaleOption[]
  /** BPMN XML 内容，传入后自动导入到画布 */
  xml?: string
  /** 是否专业模式：true 显示全部节点与属性，false 为受限模式（按 designerConfig 隐藏） */
  proDesigner?: boolean
  /** 是否启用 Token 仿真（bpmn-js-token-simulation），默认 true */
  enableTokenSimulation?: boolean
  /** 是否显示模式切换按钮，默认值为 true */
  showDesignerSwitch?: boolean
  /** 设计器配置：限制模式下隐藏的节点（大类 + 事件定义变体）与属性 tab */
  designerConfig?: DesignerConfig
  /** 是否自动把 XML 暂存到 localStorage（用于刷新恢复） */
  autoStash?: boolean
  /** 暂存 XML 使用的 localStorage 键名 */
  stashKey?: string
  /** 属性面板表单尺寸：small / medium / large */
  size?: 'small' | 'medium' | 'large'
  /** 额外 tab 的标签文本映射：{ 元素类型: 自定义标签 } */
  extraTabLabels?: Record<string, string>
  /** 保存回调：点击保存时把最新 XML 交给外部 */
  onSaveXml?: (xml: string) => void
  /** 搜索用户回调：按关键字分页搜索用户 */
  onSearchUsers?: (
    name: string,
    pageNo?: number,
    pageSize?: number,
  ) => PageResult | Promise<PageResult>
  /** 搜索用户组回调：按关键字搜索用户组 */
  onSearchUserGroups?: (name: string) => CamundaLookupItem[] | Promise<CamundaLookupItem[]>
  /** 获取流程定义列表回调：用于调用活动/决策等选择流程 */
  onFetchProcessList?: () => ProcessLookupItem[] | Promise<ProcessLookupItem[]>
  /** 搜索 Java 类回调：用于实现类（class）选择 */
  onSearchJavaClasses?: (name: string) => CamundaLookupItem[] | Promise<CamundaLookupItem[]>
  /** 搜索委托表达式回调：用于 delegateExpression 选择 */
  onSearchDelegateExpressions?: (name: string) => CamundaLookupItem[] | Promise<CamundaLookupItem[]>
  /** 搜索外部任务主题回调：用于外部任务（External Task）topic 选择 */
  onSearchExternalTopics?: (name: string) => CamundaLookupItem[] | Promise<CamundaLookupItem[]>
  /** 用户解析器表达式：用于解析办理人/候选人的 JS 表达式 */
  userResolver?: string
  /** 用户组解析器表达式：用于解析候选用户组的 JS 表达式 */
  groupResolver?: string
  /** 搜索决策引用回调：用于业务规则任务选择 DMN 决策 */
  onSearchDecisionRefs?: (name: string) => ProcessLookupItem[] | Promise<ProcessLookupItem[]>
  /** 搜索表单引用回调：用于表单引用（Camunda Forms / 外部表单）选择 */
  onSearchFormRefs?: (name: string) => ProcessLookupItem[] | Promise<ProcessLookupItem[]>
  /** 搜索表单 Key 回调：用于表单 Key 选择 */
  onSearchFormKeys?: (name: string) => CamundaLookupItem[] | Promise<CamundaLookupItem[]>
  /** AI 助手回调：接收对话历史与当前 XML，返回 AI 回复（可含修改后的 XML）。传入后工具栏显示 AI 助手入口 */
  aiChat?: AiChatHandler
}

export interface ProcessInfo {
  /** 流程 XML */
  xml: string
  /** 流程名称 */
  name: string
  /** 流程 ID */
  id: string
  /** 流程版本 */
  version: string
}

export const bpmnModelerProcessProps = {
  /** 主题：light（浅色）/ dark（深色） */
  theme: {
    type: String as PropType<ThemeType>,
    default: undefined,
  },
  /** 语言：zh-CN / en-US 等，支持的语言列表见 availableLocales */
  locale: {
    type: String as PropType<LocaleType>,
    default: undefined,
  },
  /** 语言回退：当前语言缺少翻译时使用的兜底语言 */
  localeFallback: {
    type: String as PropType<LocaleType>,
    default: undefined,
  },
  /** 自定义语言包：按语言聚合的翻译键值，可覆盖内置文案 */
  localeMessages: {
    type: Object as PropType<Record<string, Record<string, any>>>,
    default: undefined,
  },
  /** 语言切换下拉框的可选语言列表 */
  availableLocales: {
    type: Array as PropType<LocaleOption[]>,
    default: () => [
      { label: '中文', value: 'zh-CN' },
      { label: 'English', value: 'en-US' },
    ],
  },
  /** BPMN XML 内容，传入后自动导入到画布 */
  xml: {
    type: String,
    default: undefined,
  },
  /** 是否专业模式：true 显示全部节点与属性，false 为受限模式（按 designerConfig 隐藏） */
  proDesigner: {
    type: Boolean,
    default: true,
  },
  /** 是否启用 Token 仿真（bpmn-js-token-simulation），默认 true */
  enableTokenSimulation: {
    type: Boolean,
    default: true,
  },
  /** 是否显示模式切换按钮，默认值为 true */
  showDesignerSwitch: {
    type: Boolean,
    default: true,
  },
  /** 设计器配置：限制模式下隐藏的节点（大类 + 事件定义变体）与属性 tab */
  designerConfig: {
    type: Object as PropType<DesignerConfig>,
    default: undefined,
  },
  /** 是否自动把 XML 暂存到 localStorage（用于刷新恢复） */
  autoStash: {
    type: Boolean,
    default: true,
  },
  /** 暂存 XML 使用的 localStorage 键名 */
  stashKey: {
    type: String,
    default: 'camunda7-ui:stash:xml',
  },
  /** 属性面板表单尺寸：small / medium / large */
  size: {
    type: String as PropType<'small' | 'medium' | 'large'>,
    default: 'small',
  },
  /** 额外 tab 的标签文本映射：{ 元素类型: 自定义标签 } */
  extraTabLabels: {
    type: Object as PropType<Record<string, string>>,
    default: () => ({}),
  },
  /** 保存回调：点击保存时把最新 XML 交给外部 */
  onSaveXml: {
    type: Function as PropType<(xml: string) => void>,
    default: null,
  },
  /** 搜索用户回调：按关键字分页搜索用户 */
  onSearchUsers: {
    type: Function as PropType<
      (name: string, pageNo?: number, pageSize?: number) => PageResult | Promise<PageResult>
    >,
    default: null,
  },
  /** 搜索用户组回调：按关键字搜索用户组 */
  onSearchUserGroups: {
    type: Function as PropType<
      (name: string) => CamundaLookupItem[] | Promise<CamundaLookupItem[]>
    >,
    default: null,
  },
  /** 获取流程定义列表回调：用于调用活动/决策等选择流程 */
  onFetchProcessList: {
    type: Function as PropType<() => ProcessLookupItem[] | Promise<ProcessLookupItem[]>>,
    default: null,
  },
  /** 搜索 Java 类回调：用于实现类（class）选择 */
  onSearchJavaClasses: {
    type: Function as PropType<
      (name: string) => CamundaLookupItem[] | Promise<CamundaLookupItem[]>
    >,
    default: null,
  },
  /** 搜索委托表达式回调：用于 delegateExpression 选择 */
  onSearchDelegateExpressions: {
    type: Function as PropType<
      (name: string) => CamundaLookupItem[] | Promise<CamundaLookupItem[]>
    >,
    default: null,
  },
  /** 搜索外部任务主题回调：用于外部任务（External Task）topic 选择 */
  onSearchExternalTopics: {
    type: Function as PropType<
      (name: string) => CamundaLookupItem[] | Promise<CamundaLookupItem[]>
    >,
    default: null,
  },
  /** 用户解析器表达式：用于解析办理人/候选人的 JS 表达式 */
  userResolver: {
    type: String,
    default: 'approverResolver.getUsers',
  },
  /** 用户组解析器表达式：用于解析候选用户组的 JS 表达式 */
  groupResolver: {
    type: String,
    default: 'approverResolver.getUserGroups',
  },
  /** 搜索决策引用回调：用于业务规则任务选择 DMN 决策 */
  onSearchDecisionRefs: {
    type: Function as PropType<
      (name: string) => ProcessLookupItem[] | Promise<ProcessLookupItem[]>
    >,
    default: null,
  },
  /** 搜索表单引用回调：用于表单引用（Camunda Forms / 外部表单）选择 */
  onSearchFormRefs: {
    type: Function as PropType<
      (name: string) => ProcessLookupItem[] | Promise<ProcessLookupItem[]>
    >,
    default: null,
  },
  /** 搜索表单 Key 回调：用于表单 Key 选择 */
  onSearchFormKeys: {
    type: Function as PropType<
      (name: string) => CamundaLookupItem[] | Promise<CamundaLookupItem[]>
    >,
    default: null,
  },
  /** AI 助手回调：接收对话历史与当前 XML，返回 AI 回复 */
  aiChat: {
    type: Function as PropType<AiChatHandler>,
    default: null,
  },
}

export default defineComponent({
  name: 'BpmnModelerProcessContent',
  props: { ...bpmnModelerProcessProps },
  emits: ['update:theme', 'update:locale', 'update:proDesigner'],
  setup(props, { emit, slots, expose }) {
    const message = useMessage()
    const { t, currentLocale } = useCamundaI18n()

    const proDesigner = ref(props.proDesigner ?? true)

    const designerState = ref(resolveDesignerConfig(proDesigner.value, props.designerConfig))
    provideDesignerConfig(designerState)

    const nodesModule = createConfigurableNodesModule({
      isElementVisible: (target: ActionTarget) => {
        const elements = designerState.value.elements
        if (elements[target.type as ElementKey] === false) return false
        return elements[toElementKey(target)] !== false
      },
      getDefaultElementName: (bo: any) => {
        const typeKey = getElementTypeFromBo(bo)
        if (!typeKey || typeKey === 'unknown') return ''
        const label = t(`bpmnPanel.types.${typeKey}`)
        return label && !label.startsWith('bpmnPanel.types.') ? label : ''
      },
    })

    watch(
      [proDesigner, () => props.designerConfig],
      () => {
        designerState.value = resolveDesignerConfig(proDesigner.value, props.designerConfig)
        getModeler()?.get('eventBus')?.fire('i18n.changed')
      },
      { deep: true },
    )

    watch(
      () => props.proDesigner,
      (val) => {
        if (typeof val === 'boolean' && val !== proDesigner.value) {
          proDesigner.value = val
        }
      },
    )

    function setProDesigner(val: boolean) {
      proDesigner.value = val
      emit('update:proDesigner', val)
    }

    const currentTheme = ref<ThemeType>(props.theme ?? 'light')
    const currentLocaleRef = ref<LocaleType>(props.locale ?? currentLocale.value ?? 'zh-CN')

    watch(
      () => props.theme,
      (val) => {
        if (val) currentTheme.value = val
      },
    )

    const canvasRef = ref<HTMLElement | null>(null)

    /** 当前是否处于 Token 仿真模式 */
    const simulationActive = ref(false)

    const { modelerRef, init, getModeler, loadDiagram, importXml, saveXml, clearCanvas, destroy } =
      useBpmnModeler({ container: () => canvasRef.value })

    const {
      showRestoreDialog,
      debounceStash,
      checkStash,
      handleRestoreStash,
      handleDiscardStash,
      flushStash,
    } = useXmlStash({
      autoStash: props.autoStash,
      stashKey: props.stashKey,
      hasExternalXml: () => !!props.xml,
      saveXml,
      loadDiagram,
    })

    onMounted(async () => {
      init([
        customTranslateModule,
        nodesModule,
        ...(props.enableTokenSimulation ? [TokenSimulationModule, SimulationSupportModule] : []),
      ])

      const modeler = getModeler()
      if (props.enableTokenSimulation && modeler) {
        modeler.on('tokenSimulation.toggleMode', (event: any) => {
          simulationActive.value = !!event.active
        })
      }

      const initialXml = props.xml || defaultDiagram
      await loadDiagram(initialXml)

      applySimulationSpeedTitles()

      checkStash()

      if (props.autoStash) {
        const modeler = getModeler()
        modeler?.on('element.changed', debounceStash)
        modeler?.on('commandStack.changed', debounceStash)
      }

      window.addEventListener('keydown', onGlobalKeydown, { capture: true })
    })

    watch(
      () => props.xml,
      (newXml) => {
        if (newXml) {
          loadDiagram(newXml)
        }
      },
    )

    onBeforeUnmount(() => {
      flushStash()
      destroy()
      window.removeEventListener('keydown', onGlobalKeydown, { capture: true })
    })

    const showExportDialog = ref(false)
    const exportXml = ref('')
    const showSearch = ref(false)
    const showAiDialog = ref(false)

    function openAiDialog() {
      if (!props.aiChat) return
      showAiDialog.value = true
    }

    /** Ctrl/Cmd+S 保存到 onSaveXml；Ctrl/Cmd+F 切换元素搜索；Escape 关闭搜索 */
    function onGlobalKeydown(e: KeyboardEvent) {
      const key = e.key.toLowerCase()
      if ((e.ctrlKey || e.metaKey) && key === 's') {
        if (!props.onSaveXml) return
        e.preventDefault()
        saveXml()
          .then((xml) => props.onSaveXml?.(xml))
          .catch((err: any) => {
            message.error(t('bpmnPanel.importExport.exportError') + '\n' + (err.message || err))
          })
      } else if ((e.ctrlKey || e.metaKey) && key === 'f') {
        e.preventDefault()
        showSearch.value = !showSearch.value
      } else if (key === 'escape') {
        showSearch.value = false
      }
    }

    function toggleSearch() {
      showSearch.value = !showSearch.value
    }

    async function openImportExportDialog() {
      if (!getModeler()) return
      try {
        exportXml.value = await saveXml()
        showExportDialog.value = true
      } catch (err: any) {
        message.error(t('bpmnPanel.importExport.exportError') + '\n' + (err.message || err))
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
      if (!getModeler()) return
      try {
        await importXml(exportXml.value)
        centerView(getModeler())
        showExportDialog.value = false
      } catch (err: any) {
        message.error(t('bpmnPanel.importExport.importError') + '\n' + (err.message || err))
        console.error('Error importing XML', err)
      }
    }

    function toggleTheme() {
      currentTheme.value = currentTheme.value === 'dark' ? 'light' : 'dark'
      emit('update:theme', currentTheme.value)
    }

    /** 切换 Token 仿真模式（需要 enableTokenSimulation 开启） */
    function handleToggleSimulation() {
      if (!props.enableTokenSimulation) return
      toggleTokenSimulation(getModeler())
    }

    const SIMULATION_SPEED_KEYS = ['slow', 'normal', 'fast'] as const

    /** 动画速度按钮的 tooltip 在库内硬编码为英文，这里按索引替换为国际化文案 */
    function applySimulationSpeedTitles() {
      const container = canvasRef.value
      if (!container) return
      const buttons = container.querySelectorAll<HTMLElement>('.bts-animation-speed-button')
      if (!buttons.length) return
      const prefix = t('bpmnPanel.tokenSimulation.animationSpeedTitle')
      buttons.forEach((btn, idx) => {
        const key = SIMULATION_SPEED_KEYS[idx]
        if (key) btn.title = `${prefix} = ${t(`bpmnPanel.tokenSimulation.speed.${key}`)}`
      })
    }

    /** 当前是否处于 Token 仿真模式 */
    function isTokenSimulationActive() {
      return simulationActive.value
    }

    /** 获取流程信息：XML、流程名、流程 ID、流程版本 */
    async function getProcessInfo() {
      const modeler = getModeler()
      if (!modeler) return null

      const xml = await saveXml()

      let name = ''
      let id = ''
      let version = ''

      const canvas = modeler.get('canvas')
      const rootElement = canvas.getRootElement()

      if (rootElement?.businessObject) {
        const bo = rootElement.businessObject

        // BPMN Process
        let process = null

        if (bo.$type === 'bpmn:Process') {
          process = bo
        }
        // BPMN Collaboration，需要从 participants 找 processRef
        else if (bo.$type === 'bpmn:Collaboration') {
          const participant = bo.participants?.[0]
          process = participant?.processRef
        }

        if (process) {
          name = process.name || ''
          id = process.id || ''
          version = process.versionTag || ''
        }
      }

      return {
        xml,
        name,
        id,
        version,
      }
    }

    /** 运行 bpmnlint 校验，返回整个图的校验结果（按元素分组 + 统计） */
    async function validate(): Promise<ValidateResult | null> {
      const modeler = getModeler()
      if (!modeler) return null
      const linting = modeler.get('linting', false)
      if (!linting || typeof linting.lint !== 'function') return null

      const raw = (await linting.lint()) as Record<string, any[]>
      const reports: LintReport[] = []
      for (const [rule, ruleReports] of Object.entries(raw || {})) {
        for (const r of ruleReports || []) {
          reports.push({
            id: r.id,
            message: r.message,
            category: r.category === 'error' ? 'error' : r.category === 'warn' ? 'warn' : 'info',
            rule,
            path: r.path,
          })
        }
      }

      const byElement: Record<string, LintReport[]> = {}
      for (const report of reports) {
        if (!byElement[report.id]) byElement[report.id] = []
        byElement[report.id]!.push(report)
      }

      return {
        total: reports.length,
        errors: reports.filter((r) => r.category === 'error').length,
        warnings: reports.filter((r) => r.category === 'warn').length,
        infos: reports.filter((r) => r.category === 'info').length,
        reports,
        byElement,
      }
    }

    expose({
      getProcessInfo,
      validate,
      toggleTokenSimulation: handleToggleSimulation,
      isTokenSimulationActive,
    })

    function handleLocaleChange(value: string) {
      currentLocaleRef.value = value as LocaleType
      setLocale(value as LocaleType)
      emit('update:locale', value)
      getModeler()?.get('eventBus')?.fire('i18n.changed')
      applySimulationSpeedTitles()
    }

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
        lookups={{
          searchUsers: props.onSearchUsers,
          searchUserGroups: props.onSearchUserGroups,
          fetchProcessList: props.onFetchProcessList,
          searchJavaClasses: props.onSearchJavaClasses,
          searchDelegateExpressions: props.onSearchDelegateExpressions,
          searchExternalTopics: props.onSearchExternalTopics,
          searchDecisionRefs: props.onSearchDecisionRefs,
          searchFormRefs: props.onSearchFormRefs,
          searchFormKeys: props.onSearchFormKeys,
        }}
      >
        {{
          default: () => (
            <NLayout has-sider sider-placement="right" position="absolute">
              <NLayoutContent
                class="h-full"
                content-style="height: 100%; display: flex; flex-direction: column;"
              >
                <div ref={canvasRef} class="bpmn-container" style="flex: 1; min-height: 0;" />
                <ElementSearchPanel
                  modeler={modelerRef.value}
                  size={props.size}
                  show={showSearch.value}
                  onUpdateShow={(v: boolean) => {
                    showSearch.value = v
                  }}
                />
                <DesignerSwitch
                  size={props.size}
                  proDesigner={proDesigner.value}
                  showDesignerSwitch={props.showDesignerSwitch}
                  onSetProDesigner={setProDesigner}
                  v-slots={{ footer: slots.footer }}
                />
                <ModelerToolbar
                  modeler={modelerRef.value}
                  size={props.size}
                  currentLocale={currentLocaleRef.value}
                  availableLocales={props.availableLocales}
                  currentTheme={currentTheme.value}
                  onLocaleChange={handleLocaleChange}
                  onToggleTheme={toggleTheme}
                  onSearch={toggleSearch}
                  onOpenAi={openAiDialog}
                  onZoomIn={() => zoomIn(modelerRef.value)}
                  onZoomOut={() => zoomOut(modelerRef.value)}
                  onCenter={() => centerView(modelerRef.value)}
                  onUndo={() => undo(modelerRef.value)}
                  onRedo={() => redo(modelerRef.value)}
                  onToggleMinimap={() => toggleMinimap(modelerRef.value)}
                  simulationActive={simulationActive.value}
                  showTokenSimulation={props.enableTokenSimulation}
                  onToggleSimulation={handleToggleSimulation}
                  onOpenImportExport={openImportExportDialog}
                  onClear={() => clearCanvas(defaultDiagram)}
                  v-slots={{ buttons: slots.buttons }}
                />
                <ImportExportDialog
                  show={showExportDialog.value}
                  size={props.size}
                  value={exportXml.value}
                  onUpdateShow={(val: boolean) => {
                    showExportDialog.value = val
                  }}
                  onUpdateValue={(val: string) => {
                    exportXml.value = val
                  }}
                  onDownload={downloadXml}
                  onSaveToModeler={saveXmlToModeler}
                />
                <RestoreStashDialog
                  show={showRestoreDialog.value}
                  size={props.size}
                  onPositive={handleRestoreStash}
                  onNegative={handleDiscardStash}
                  onUpdateShow={(val: boolean) => {
                    showRestoreDialog.value = val
                  }}
                />
                {props.aiChat && (
                  <AiChatDialog
                    show={showAiDialog.value}
                    size={props.size}
                    aiChat={props.aiChat}
                    getXml={() => saveXml()}
                    onApplyXml={(xml: string) => loadDiagram(xml)}
                    onUpdateShow={(val: boolean) => {
                      showAiDialog.value = val
                    }}
                  />
                )}
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
