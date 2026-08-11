import { defineComponent, ref, getCurrentInstance } from 'vue'
import { NMessageProvider } from 'naive-ui'
import BpmnModelerProcessContent, {
  bpmnModelerProcessProps,
  type BpmnModelerProcessProps,
} from './BpmnModelerProcessContent'
import type { ValidateResult, LintReport } from '@/lint'

/**
 * @description 基于 camunda-bpmn-js 的 BPMN 流程设计器组件。
 * 内置完整建模能力：画布编辑、属性面板、工具栏（缩放 / 撤销重做 / 导入导出 / 清空 /
 * 迷你地图）、专业与受限双模式切换、localStorage 暂存恢复，并支持多语言与深浅主题。
 *
 * ## 基本用法
 *
 * ```tsx
 * <BpmnModelerProcess
 *   xml={initialXml}
 *   proDesigner
 *   autoStash
 *   onSaveXml={(xml) => console.log(xml)}
 * />
 * ```
 *
 * ## Props
 *
 * ### 主题与语言
 * - `theme`：`light` / `dark`，默认 `undefined`（跟随全局）
 * - `locale`：界面语言，如 `zh-CN`、`en-US`，默认 `zh-CN`
 * - `localeFallback`：翻译缺失时的兜底语言
 * - `localeMessages`：自定义语言包，按语言聚合键值覆盖内置文案
 * - `availableLocales`：语言下拉框可选列表，默认中 / 英
 *
 * ### 画布与模式
 * - `xml`：BPMN XML，传入后自动导入画布
 * - `proDesigner`：专业模式（显示全部节点与属性），默认 `true`
 * - `showDesignerSwitch`：是否显示模式切换按钮，默认 `true`
 * - `designerConfig`：受限模式下隐藏的节点与属性 tab 配置
 * - `enableTokenSimulation`：是否启用 Token 仿真，默认 `true`
 *
 * ### 暂存与表单
 * - `autoStash`：自动暂存 XML 到 localStorage，默认 `true`
 * - `stashKey`：暂存键名，默认 `camunda7-ui:stash:xml`
 * - `size`：表单尺寸 `small` / `medium` / `large`，默认 `small`
 * - `extraTabLabels`：额外 tab 标签文本映射
 *
 * ### 数据源回调
 * - `onSaveXml(xml)`：保存时回传最新 XML
 * - `onSearchUsers(name, pageNo, pageSize)`：分页搜索用户
 * - `onSearchUserGroups(name)`：搜索用户组
 * - `onFetchProcessList()`：获取流程定义列表
 * - `onSearchJavaClasses(name)`：搜索实现类
 * - `onSearchDelegateExpressions(name)`：搜索委托表达式
 * - `onSearchExternalTopics(name)`：搜索外部任务主题
 * - `onSearchDecisionRefs(name)`：搜索 DMN 决策
 * - `onSearchFormRefs(name)` / `onSearchFormKeys(name)`：搜索表单引用 / 表单 Key
 * - `userResolver` / `groupResolver`：办理人 / 用户组解析器表达式
 *
 * ## Emits
 *
 * - `update:theme`：切换主题时触发
 * - `update:locale`：切换语言时触发
 * - `update:proDesigner`：切换专业 / 受限模式时触发
 *
 * ## 暴露的方法（通过 ref 调用）
 *
 * - `getProcessInfo()`：获取流程信息（XML、流程名、流程 ID、流程版本）
 * - `validate()`：运行 bpmnlint 校验，返回 `ValidateResult`（问题统计 + 按元素分组的问题列表）
 * - `toggleTokenSimulation()`：切换 Token 仿真模式
 * - `isTokenSimulationActive()`：当前是否处于 Token 仿真模式
 *
 * ## 插槽
 *
 * 以下具名插槽会透传到内容组件：
 * - `start-event-extra` / `end-event-extra` / `intermediate-throw-event-extra` /
 *   `intermediate-catch-event-extra` / `task-extra` / `gateway-extra`：属性面板额外 tab
 * - `buttons`：工具栏自定义按钮
 * - `footer`：模式切换器底部自定义内容
 *
 * @author zjj
 * @version 1.0.0
 */
export default defineComponent<BpmnModelerProcessProps>({
  name: 'BpmnModelerProcess',
  props: { ...bpmnModelerProcessProps },
  emits: ['update:theme', 'update:locale', 'update:proDesigner'],
  setup(props, { emit, slots, expose }) {
    const contentRef = ref<any | null>(null)

    async function getProcessInfo() {
      return contentRef.value?.getProcessInfo() ?? null
    }

    /** 运行 bpmnlint 校验，返回整个图的校验结果 */
    async function validate(): Promise<ValidateResult | null> {
      return contentRef.value?.validate() ?? null
    }

    /** 切换 Token 仿真模式（需 enableTokenSimulation 开启） */
    function toggleTokenSimulation() {
      return contentRef.value?.toggleTokenSimulation()
    }

    /** 当前是否处于 Token 仿真模式 */
    function isTokenSimulationActive() {
      return contentRef.value?.isTokenSimulationActive() ?? false
    }

    expose({
      getProcessInfo,
      validate,
      toggleTokenSimulation,
      isTokenSimulationActive,
    })

    return () => (
      <NMessageProvider>
        <BpmnModelerProcessContent
          ref={contentRef}
          {...props}
          onUpdate:theme={(value: any) => emit('update:theme', value)}
          onUpdate:locale={(value: any) => emit('update:locale', value)}
          onUpdate:proDesigner={(value: any) => emit('update:proDesigner', value)}
          v-slots={slots}
        />
      </NMessageProvider>
    )
  },
})
