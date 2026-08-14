> **English version**: [README.md](README.md)

# camunda7-ui

[![npm version](https://img.shields.io/npm/v/@zeng-alt/camunda7-ui.svg)](https://www.npmjs.com/package/@zeng-alt/camunda7-ui)
[![License](https://img.shields.io/npm/l/@zeng-alt/camunda7-ui.svg)](https://github.com/zeng-alt/camunda7-ui/blob/main/LICENSE)
[![Node Version](https://img.shields.io/node/v/@zeng-alt/camunda7-ui.svg)](https://github.com/zeng-alt/camunda7-ui)

面向 Vue 3 的 **Camunda 7 BPMN 建模器** 与 **流程查看器** 组件库，基于 Naive UI 构建。提供开箱即用的流程设计、执行监控、工作流管理组件。

## 特性

- 🎨 **BPMN 建模器** — 基于 `camunda-bpmn-js` 的全功能流程设计器
- 👁️ **流程查看器** — 只读查看器，支持执行状态高亮与时间线
- ⚙️ **属性面板** — 完整的 Camunda 7 属性编辑器（表单、脚本、连接器、DMN 等）
- 🌓 **主题与国际化** — 内置浅/深色主题，中英文双语，支持自定义语言包
- 🔌 **可扩展** — 基于插槽的扩展机制：自定义属性标签页、工具栏按钮等
- 🧪 **BPMNLint 校验** — 内置流程校验，支持字段级反馈与校验面板
- 🔍 **Camunda 表单任务** — 完整表单任务支持（字段、枚举、约束、实时预览）
- 📦 **Tree-shakable** — ESM + UMD 构建，附带 TypeScript 声明
- 🎯 **核心无框架依赖** — Peer dependencies: Vue 3、Naive UI、@vueuse/core

## 安装

```bash
# npm
npm install @zeng-alt/camunda7-ui naive-ui @vueuse/core vue

# pnpm (推荐)
pnpm add @zeng-alt/camunda7-ui naive-ui @vueuse/core vue

# yarn
yarn add @zeng-alt/camunda7-ui naive-ui @vueuse/core vue
```

> **Peer dependencies:** `vue@>=3.5.13`, `naive-ui@>=2.44.1`, `@vueuse/core@>=13.0.0`，以及脚本编辑器所需的 `@codemirror/*` 系列包

## 快速开始

```vue
<script setup lang="ts">
import {
  CamundaConfigProvider,
  BpmnModelerProcess,
  BpmnProcessViewer,
} from '@zeng-alt/camunda7-ui'
import '@zeng-alt/camunda7-ui/style.css'
import 'naive-ui/dist/style.css' // 或使用 naive-ui 主题提供器
</script>

<template>
  <CamundaConfigProvider theme="light" locale="en-US">
    <!-- BPMN 建模器（可编辑） -->
    <BpmnModelerProcess
      :xml="initialXml"
      :pro-designer="true"
      :auto-stash="true"
      @save-xml="handleSave"
    />

    <!-- 流程查看器（只读 + 执行状态） -->
    <BpmnProcessViewer
      :process-xml="processXml"
      :execution-state="executionState"
      :show-timeline="true"
    />
  </CamundaConfigProvider>
</template>
```

## 核心组件

| 组件 | 说明 |
|------|------|
| `CamundaConfigProvider` | 主题、语言、查找函数配置提供者（必需的包装组件） |
| `BpmnModelerProcess` | 全功能 BPMN 流程设计器，含属性面板 |
| `BpmnProcessViewer` | 只读流程查看器，支持执行状态与时间线 |
| `CamundaPropertiesPanel` | 独立属性面板（建模器内部使用） |
| `BpmnPreviewModal` | 实时 BPMN 预览弹窗 |
| 基础组件 | 可复用编辑器：`GeneralPanel`、`FormPanel`、`FormFieldEditor`、`FormPreview`、`ScriptFields`、`ImplementationExtraFields`、`IOAssignmentPanel`、`ExecutionListenersPanel`、`TaskListenersPanel`、`FieldInjections`、`ConnectorFields`、`DmnFields`、`ErrorFields`、`ExternalTaskFields`、`TimerDefinitionFields`、`ConditionalDefinitionFields`、`MessageDefinitionFields`、`SignalDefinitionFields`、`EscalationDefinitionFields`、`CompensationDefinitionFields`、`LinkDefinitionFields`、`ExtensionPropertiesPanel`、`MultiInstanceFields`、`AsyncCheckboxes`、`DocumentationPanel`、`HintTooltip`、`InMappings`/`OutMappings`、`LintPanel` 等 |

---

## CamundaConfigProvider

必需的包装组件，为所有后代组件提供主题、语言与查找函数。

### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `theme` | `'light' \| 'dark'` | `'light'` | 全局主题 |
| `locale` | `string` | `'zh-CN'` | 当前语言（如 `zh-CN`、`en-US`） |
| `localeFallback` | `string` | `undefined` | 翻译缺失时的兜底语言 |
| `localeMessages` | `Record<string, Record<string, any>>` | `undefined` | 自定义翻译覆盖 |
| `availableLocales` | `LocaleOption[]` | `[{label: '中文', value: 'zh-CN'}, {label: 'English', value: 'en-US'}]` | 语言切换下拉选项 |
| `lookups` | `Partial<CamundaLookups>` | `undefined` | 作用域查找函数（见下表） |

### 查找函数 (`lookups` prop)

| Key | 签名 | 使用位置 |
|-----|------|----------|
| `searchUsers` | `(name, pageNo?, pageSize?) => Promise<PageResult>` | 办理人/候选人选择器 |
| `searchUserGroups` | `(name) => Promise<CamundaLookupItem[]>` | 候选用户组选择器 |
| `fetchProcessList` | `() => Promise<ProcessLookupItem[]>` | 调用活动、DMN 决策引用 |
| `searchJavaClasses` | `(name) => Promise<CamundaLookupItem[]>` | 服务任务类选择器 |
| `searchDelegateExpressions` | `(name) => Promise<CamundaLookupItem[]>` | 委托表达式选择器 |
| `searchExternalTopics` | `(name) => Promise<CamundaLookupItem[]>` | 外部任务主题选择器 |
| `searchDecisionRefs` | `(name) => Promise<ProcessLookupItem[]>` | 业务规则任务 DMN 选择器 |
| `searchFormRefs` | `(name) => Promise<ProcessLookupItem[]>` | 表单引用选择器 |
| `searchFormKeys` | `(name) => Promise<CamundaLookupItem[]>` | 表单 Key 选择器 |

### Slots

| Slot | 说明 |
|------|------|
| `default` | 子组件默认插槽 |

---

## BpmnModelerProcess

全功能 BPMN 2.0 流程设计器，包含画布、属性面板、工具栏、模式切换。

### Props

#### 主题与语言

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `theme` | `'light' \| 'dark'` | `undefined` | 主题（回退到 Provider） |
| `locale` | `string` | `undefined` | 语言（回退到 Provider） |
| `localeFallback` | `string` | `undefined` | 兜底语言 |
| `localeMessages` | `Record<string, Record<string, any>>` | `undefined` | 自定义翻译 |
| `availableLocales` | `LocaleOption[]` | `[zh-CN, en-US]` | 语言下拉选项 |

#### 画布与模式

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `xml` | `string` | `undefined` | 初始 BPMN XML（自动导入） |
| `proDesigner` | `boolean` | `true` | 专业模式（显示全部节点/属性） |
| `showDesignerSwitch` | `boolean` | `true` | 显示专业/受限模式切换按钮 |
| `designerConfig` | `DesignerConfig` | `undefined` | 受限模式配置 |

#### 持久化

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `autoStash` | `boolean` | `true` | 自动将 XML 暂存到 localStorage |
| `stashKey` | `string` | `'camunda7-ui:stash:xml'` | localStorage 键名 |
| `size` | `'small' \| 'medium' \| 'large'` | `'small'` | 属性面板表单尺寸 |
| `extraTabLabels` | `Record<string, string>` | `{}` | 扩展标签页自定义标签文本 |

#### 回调（数据源集成）

| Prop | 类型 | 说明 |
|------|------|------|
| `onSaveXml` | `(xml: string) => void` | 用户点击保存时回调 |
| `onSearchUsers` | `(name, pageNo?, pageSize?) => PageResult` | 分页用户搜索 |
| `onSearchUserGroups` | `(name) => CamundaLookupItem[]` | 用户组搜索 |
| `onFetchProcessList` | `() => ProcessLookupItem[]` | 流程定义列表（调用活动/DMN） |
| `onSearchJavaClasses` | `(name) => CamundaLookupItem[]` | Java 类搜索 |
| `onSearchDelegateExpressions` | `(name) => CamundaLookupItem[]` | 委托表达式搜索 |
| `onSearchExternalTopics` | `(name) => CamundaLookupItem[]` | 外部任务主题搜索 |
| `onSearchDecisionRefs` | `(name) => ProcessLookupItem[]` | DMN 决策搜索 |
| `onSearchFormRefs` | `(name) => ProcessLookupItem[]` | 表单引用搜索 |
| `onSearchFormKeys` | `(name) => CamundaLookupItem[]` | 表单 Key 搜索 |
| `userResolver` | `string` | 办理人解析表达式（默认 `'approverResolver.getUsers'`） |
| `groupResolver` | `string` | 候选用户组解析表达式（默认 `'approverResolver.getUserGroups'`） |

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:theme` | `theme: 'light' \| 'dark'` | 工具栏切换主题时触发 |
| `update:locale` | `locale: string` | 工具栏切换语言时触发 |
| `update:proDesigner` | `proDesigner: boolean` | 切换专业/受限模式时触发 |

### Slots

所有插槽透传给内部 `BpmnModelerProcessContent`。

| Slot | 上下文 | 说明 |
|------|--------|------|
| `start-event-extra` | — | 开始事件属性扩展标签页 |
| `end-event-extra` | — | 结束事件属性扩展标签页 |
| `intermediate-throw-event-extra` | — | 中间抛出事件扩展标签页 |
| `intermediate-catch-event-extra` | — | 中间捕获事件扩展标签页 |
| `task-extra` | — | 任务类型扩展标签页（用户、服务、脚本等） |
| `gateway-extra` | — | 网关属性扩展标签页 |
| `buttons` | — | ModelerToolbar 右侧自定义按钮 |
| `footer` | — | DesignerSwitch 底部自定义内容 |

#### 插槽使用示例

```vue
<BpmnModelerProcess :xml="xml" @save-xml="save">
  <template #buttons>
    <n-button @click="customAction">自定义</n-button>
  </template>
  <template #task-extra="scope">
    <CustomTaskTab v-bind="scope" />
  </template>
</BpmnModelerProcess>
```

### 方法（通过 template ref）

```ts
const modelerRef = ref<InstanceType<typeof BpmnModelerProcess>>()

// 获取当前流程信息（XML、名称、ID、版本）
const info = await modelerRef.value?.getProcessInfo()
// info: { xml: string, name: string, id: string, version: string } | null

// 运行 bpmnlint 校验
const result = await modelerRef.value?.validate()
// result: ValidateResult | null
```

> 组件通过 `expose()` 暴露 `getProcessInfo()` 与 `validate()`。`ValidateResult` 提供 `total`、`errors`、`warnings`、`infos`、`reports[]` 与 `byElement`（按元素 ID 分组）。更底层的能力请使用库导出的 composables（如 `useLint`）。

---

## BpmnProcessViewer

只读流程查看器，支持执行状态可视化（高亮、徽标、时间线）。

### Props

#### 主题与语言

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `theme` | `'light' \| 'dark'` | `undefined` | 主题（回退到 Provider） |
| `locale` | `string` | `undefined` | 语言（回退到 Provider） |
| `localeFallback` | `string` | `undefined` | 兜底语言 |
| `localeMessages` | `Record<string, Record<string, any>>` | `undefined` | 自定义翻译 |
| `availableLocales` | `LocaleOption[]` | `[zh-CN, en-US]` | 语言下拉选项 |

#### 数据

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `processXml` | `string` | `''` | 要显示的 BPMN XML |
| `executionState` | `ProcessExecutionState \| null` | `null` | 执行状态（用于高亮） |
| `showTimeline` | `boolean` | `false` | 显示右侧时间线面板 |

#### 回调

| Prop | 类型 | 说明 |
|------|------|------|
| `onSearchUsers` | `(name: string) => any` | Tooltip 中解析办理人名称 |
| `onSearchUserGroups` | `(name: string) => any` | Tooltip 中解析候选用户组名称 |

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:theme` | `theme: 'light' \| 'dark'` | 工具栏切换主题时触发 |
| `update:locale` | `locale: string` | 工具栏切换语言时触发 |

### Slots

| Slot | 说明 |
|------|------|
| `default` | 未使用（查看器布局固定） |

### 执行状态类型

```ts
interface ProcessExecutionState {
  elements: Record<string, {
    status: 'pending' | 'active' | 'completed' | 'rejected'
    visitCount: number
    rejectCount: number
    assignee?: string
    candidateUsers?: string[]
    candidateGroups?: string[]
  }>
}
```

连接线（sequence flow）状态由节点状态 + 图结构**自动推断**，无需单独提供。规则：目标节点 `active` → 连接线 `active`；源节点 `rejected` → 连接线 `rejected`；源节点 `completed` → 连接线 `completed`；其余为 `pending`。

### 方法（通过 template ref）

```ts
const viewerRef = ref<InstanceType<typeof BpmnProcessViewer>>()

// 程序化控制
viewerRef.value?.zoomIn()
viewerRef.value?.zoomOut()
viewerRef.value?.fitViewport()
```

---

## BpmnPreviewModal

基于 `NavigatedViewer` 的实时 BPMN 预览弹窗。弹窗尺寸会自动跟随画布内容（最小 640×480，最大 95vw/95vh），小图弹窗小、大图撑满视口；图形缩放使用默认的 `fit-viewport` 行为（不会放大超过 100%）。

### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `xml` | `string` | `''` | 要预览的 BPMN XML |
| `title` | `string` | `''` | 弹窗标题（默认使用内置的「预览」文案） |
| `theme` | `'light' \| 'dark'` | `undefined` | 主题（未传时继承全局） |
| `locale` | `string` | `undefined` | 语言（未传时继承全局） |
| `width` | `string \| number` | `800` | 内容尺寸未知时的兜底宽度 |
| `height` | `string \| number` | `600` | 内容尺寸未知时的兜底高度 |

### 方法（通过 template ref）

| 方法 | 说明 |
|------|------|
| `open(xml?)` | 打开弹窗并（重新）加载给定 XML，缺省时回退到 `xml` prop |
| `close()` | 关闭弹窗 |

### 事件

| 事件 | 载荷 | 说明 |
|------|------|------|
| `close` | — | 弹窗关闭时触发（X / ESC / 点击遮罩） |

### 使用示例

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { BpmnPreviewModal, type ThemeType } from '@zeng-alt/camunda7-ui'

const theme = ref<ThemeType>('dark')
const previewRef = ref<InstanceType<typeof BpmnPreviewModal> | null>(null)

function handlePreview(xml: string) {
  previewRef.value?.open(xml)
}
</script>

<template>
  <n-button @click="handlePreview(currentXml)">预览</n-button>
  <BpmnPreviewModal ref="previewRef" :theme="theme" />
</template>
```

预览设计器当前内容时，先取出 XML：

```ts
async function handlePreview(modeler: any) {
  const { xml } = await modeler.saveXML({ format: true })
  previewRef.value?.open(xml)
}
```

---

## 国际化 (i18n)

所有 UI 文案使用内置轻量级 i18n 系统（无需 `vue-i18n`）。

### 在自定义组件中使用

```ts
import { useCamundaI18n } from '@zeng-alt/camunda7-ui'

const { t } = useCamundaI18n()
t('bpmnPanel.general.name') // '名称'
t('bpmnPanel.tabs.userTask') // '用户任务'
```

### 语言包文件

- `src/locales/zh.json` — 中文（默认）
- `src/locales/en.json` — 英文

### 自定义翻译

```vue
<CamundaConfigProvider
  :locale-messages="{
    'en-US': {
      bpmnPanel: { general: { name: 'Process Name' } }
    }
  }"
>
  <BpmnModelerProcess />
</CamundaConfigProvider>
```

---

## 主题定制

### 内置主题

- `light` — 默认浅色主题
- `dark` — 深色主题

### 通过 UnoCSS 定制

库使用 **UnoCSS** 并带有自定义主题。可覆盖 CSS 变量或扩展 `uno.config.ts`：

```ts
// uno.config.ts (你的应用中)
import { defineConfig } from 'unocss'

export default defineConfig({
  theme: {
    colors: {
      primary: '#your-brand-color',
      dark: '#1a1a2e',
      light_border: '#e0e0e0',
      dark_border: '#333',
    },
  },
})
```

### Naive UI 主题覆盖

Provider 自动应用紧凑间距覆盖。进一步定制：

```ts
import { create, NConfigProvider } from 'naive-ui'

const naive = create({
  components: {
    Button: { /* ... */ },
  },
})

<CamundaConfigProvider>
  <NConfigProvider :theme-overrides="customOverrides">
    <App />
  </NConfigProvider>
</CamundaConfigProvider>
```

---

## 架构概览

```
src/
├── components/
│   ├── config-provider/          # CamundaConfigProvider
│   ├── bpmn-modeler-process/     # BpmnModelerProcess (编辑器)
│   │   ├── components/           # Toolbar、DesignerSwitch、Dialogs、PreviewModal
│   │   ├── composables/          # useBpmnModeler、useXmlStash、useDiagramActions
│   │   └── features/configurable-nodes/  # 受限模式调色板
│   ├── bpmn-viewer/              # BpmnProcessViewer、NodeTooltip、Legend、TimelinePanel
│   └── bpmn-panel/               # 属性面板与基础组件
│       ├── base/                 # 可复用字段组件
│       ├── task/                 # 任务专用扩展字段
│       ├── events/               # 事件专用扩展字段
│       ├── subprocess/           # 子流程 / AdHoc / 事务字段
│       ├── flow/                 # 顺序流字段
│       ├── call-activity/        # 调用活动字段
│       ├── gateways/             # 网关面板
│       ├── swimlanes/            # 泳道 / 泳池 / 协作
│       ├── data/                 # 数据存储/对象引用
│       ├── group/                # 分组面板
│       ├── association/ text-annotation/
│       └── lint/                 # LintPanel、LintFieldFeedback
├── composables/                  # 共享 composables
│   ├── useBpmnProperties.ts      # 属性面板助手
│   ├── useFormSize.ts            # 表单尺寸缩放
│   ├── useMultiInstance.ts       # 多实例逻辑
│   ├── useCamundaLookups.ts      # 作用域查找注入
│   └── useLint.ts / useLintField.ts # bpmnlint 集成
├── lint/                         # bpmnlint 规则与配置 (camunda7RuleFactories, linterConfig)
├── locales/                      # i18n (zh.json, en.json)
├── utils/bpmn/                   # BPMN 工具 (elementType, uid, getDefinitions)
└── index.ts                      # 库入口 (导出 virtual:uno.css + 所有组件)
```

---

## 校验与验证

建模器内置 bpmnlint 校验能力。

### 建模器 `validate()` 方法

在 ref 上调用 `validate()` 可对整个图进行校验：

```ts
const result = await modelerRef.value?.validate()
// result: ValidateResult | null
// { total, errors, warnings, infos, reports: LintReport[], byElement }
```

### Composables

- `useLint(getModeler)` — 订阅建模器的 `linting` 服务，暴露 `issuesByElement`、`issuesFor(elementId)`、`lintingActive`、`refresh()`
- `useLintField(getModeler, getBusinessObjectId, fieldPath, localeKeyPrefix?)` — 将校验问题映射到具体属性字段，返回 NaiveUI `{ status, feedback }` 用于行内校验

```ts
import { useLint, useLintField, type ValidateResult } from '@zeng-alt/camunda7-ui'
```

### 内置规则

自定义规则工厂以 `camunda7RuleFactories` 导出，并打包进 `linterConfig`。可在属性面板的 `LintPanel` 中调整严格程度。校验配置位于 `src/lint/`，可在你自己的构建中扩展。

---

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器 (playground: http://localhost:5173)
pnpm dev

# 类型检查 + 构建库 (输出到 dist/)
pnpm build

# 格式化代码 (oxfmt: 无分号、单引号)
pnpm format
```

### 测试

使用 **Vitest** + **@vue/test-utils**（jsdom）运行测试。测试文件与被测代码同目录，放在 `__tests__/` 文件夹下，且已排除在库的类型检查/构建之外。

```bash
# 运行全部测试一次
pnpm test

# 监听模式
pnpm test:watch

# 带覆盖率报告运行（v8）
pnpm test:coverage
```

当前覆盖重点是纯逻辑与几个代表性组件：

- `src/utils/bpmn` — 元素类型/图标解析、模板注册表、`uid`/`getDefinitions`
- `src/lint/rules.ts` — 自定义 `camunda7/*` 校验规则
- `src/composables/useBpmnProperties` — 建模器属性读写工具
- `src/components/bpmn-panel/base/DocumentationPanel` — 组件测试示例（mock 建模器）

组件用到的浏览器 API（如 `matchMedia`、`ResizeObserver`）在 `src/test/setup.ts` 中做了 stub。

### Playground

`playground/` 目录包含演示应用（`main.ts`、`App.vue`），通过 `camunda7-ui` 别名引用库（解析到 `src/index.ts`），用于手动测试。

### 项目结构要点

- **库入口**: `src/index.ts` — 导出 `virtual:uno.css` 副作用 + 所有组件
- **构产**: Vite lib 模式 → `dist/camunda7-ui.{es,umd}.js`、`dist/camunda7-ui.css`、`dist/index.d.ts`
- **外部依赖** (peer deps，不打包): `vue`、`naive-ui`、`@vueuse/core`、`@codemirror/*`
- **格式化**: `oxfmt` — 强制无分号 + 单引号 (见 `.oxfmtrc.json`)

---

## 发布

```bash
pnpm build
cd dist
npm publish --access public
```

仅发布 `dist/` 目录（见 `package.json` 的 `files` 字段）。

---

## 许可证

AGPL-3.0-only — 详见 [LICENSE](LICENSE)。

---

## 贡献

1. Fork 本仓库
2. 创建特性分支: `git checkout -b feat/amazing-feature`
3. 提交变更: `git commit -m 'feat: add amazing feature'`
4. 推送分支: `git push origin feat/amazing-feature`
5. 发起 Pull Request

提交前请运行 `pnpm format` 和 `pnpm build`。

---

## 支持

- 📖 **文档**: [GitHub Wiki](https://github.com/zeng-alt/camunda7-ui/wiki) (待完善)
- 🐛 **Issue**: [GitHub Issues](https://github.com/zeng-alt/camunda7-ui/issues)
- 💬 **讨论**: [GitHub Discussions](https://github.com/zeng-alt/camunda7-ui/discussions)

---

## 致谢

基于以下优秀开源项目构建：

- [camunda-bpmn-js](https://github.com/camunda/camunda-bpmn-js) — BPMN 建模工具包
- [Naive UI](https://www.naiveui.com/) — Vue 3 组件库
- [UnoCSS](https://unocss.dev/) — 原子化 CSS 引擎
- [VueUse](https://vueuse.org/) — Composition API 实用工具集

---

> **English version**: [README.md](README.md)