> **中文版本**: [README.zh.md](README.zh.md)

# camunda7-ui

[![npm version](https://img.shields.io/npm/v/@zeng-alt/camunda7-ui.svg)](https://www.npmjs.com/package/@zeng-alt/camunda7-ui)
[![License](https://img.shields.io/npm/l/@zeng-alt/camunda7-ui.svg)](https://github.com/zeng-alt/camunda7-ui/blob/main/LICENSE)
[![Node Version](https://img.shields.io/node/v/@zeng-alt/camunda7-ui.svg)](https://github.com/zeng-alt/camunda7-ui)

A Vue 3 component library for building **Camunda 7 BPMN modelers** and **process viewers** with Naive UI. Provides production-ready components for process design, execution monitoring, and workflow management.

## Features

- 🎨 **BPMN Modeler** — Full-featured process designer based on `camunda-bpmn-js`
- 👁️ **Process Viewer** — Read-only viewer with execution state highlighting & timeline
- ⚙️ **Property Panels** — Complete Camunda 7 property editors (forms, scripts, connectors, DMN, etc.)
- 🌓 **Theme & i18n** — Built-in light/dark themes, Chinese/English with custom locale support
- 🔌 **Extensible** — Slot-based extension for custom property tabs, toolbar buttons, and more
- 📦 **Tree-shakable** — ESM + UMD builds with TypeScript declarations
- 🎯 **Framework agnostic core** — Peer dependencies on Vue 3, Naive UI, @vueuse/core

## Installation

```bash
# npm
npm install @zeng-alt/camunda7-ui naive-ui @vueuse/core vue

# pnpm (recommended)
pnpm add @zeng-alt/camunda7-ui naive-ui @vueuse/core vue

# yarn
yarn add @zeng-alt/camunda7-ui naive-ui @vueuse/core vue
```

> **Peer dependencies:** `vue@>=3.5.13`, `naive-ui@>=2.44.1`, `@vueuse/core@>=13.0.0`

## Quick Start

```vue
<script setup lang="ts">
import {
  CamundaConfigProvider,
  BpmnModelerProcess,
  BpmnProcessViewer,
} from '@zeng-alt/camunda7-ui'
import '@zeng-alt/camunda7-ui/style.css'
import 'naive-ui/dist/style.css' // or use naive-ui theme provider
</script>

<template>
  <CamundaConfigProvider theme="light" locale="en-US">
    <!-- BPMN Modeler (editable) -->
    <BpmnModelerProcess
      :xml="initialXml"
      :pro-designer="true"
      :auto-stash="true"
      @save-xml="handleSave"
    />

    <!-- Process Viewer (read-only with execution state) -->
    <BpmnProcessViewer
      :process-xml="processXml"
      :execution-state="executionState"
      :show-timeline="true"
    />
  </CamundaConfigProvider>
</template>
```

## Core Components

| Component | Description |
|-----------|-------------|
| `CamundaConfigProvider` | Theme, locale, and lookup configuration provider (required wrapper) |
| `BpmnModelerProcess` | Full-featured BPMN process designer with property panel |
| `BpmnProcessViewer` | Read-only process viewer with execution state & timeline |
| `CamundaPropertiesPanel` | Standalone property panel (used internally by Modeler) |
| Base components | Reusable editors: `GeneralPanel`, `FormPanel`, `ScriptFields`, `ImplementationExtraFields`, `IOAssignmentPanel`, `ExecutionListenersPanel`, `TaskListenersPanel`, `FieldInjections`, `ConnectorFields`, `DmnFields`, `ErrorFields`, `ExternalTaskFields`, `TimerDefinitionFields`, `ConditionalDefinitionFields`, `MessageDefinitionFields`, `SignalDefinitionFields`, `ExtensionPropertiesPanel`, `MultiInstanceFields`, `AsyncCheckboxes`, `DocumentationPanel`, `HintTooltip`, and more |

---

## CamundaConfigProvider

Required wrapper component that provides theme, locale, and lookup functions to all descendant components.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `'light' \| 'dark'` | `'light'` | Global theme |
| `locale` | `string` | `'zh-CN'` | Current locale (e.g., `zh-CN`, `en-US`) |
| `localeFallback` | `string` | `undefined` | Fallback locale when translation missing |
| `localeMessages` | `Record<string, Record<string, any>>` | `undefined` | Custom translation overrides |
| `availableLocales` | `LocaleOption[]` | `[{label: '中文', value: 'zh-CN'}, {label: 'English', value: 'en-US'}]` | Locale selector options |
| `lookups` | `Partial<CamundaLookups>` | `undefined` | Scoped lookup functions (see below) |

### Lookup Functions (`lookups` prop)

| Key | Signature | Used By |
|-----|-----------|---------|
| `searchUsers` | `(name: string, pageNo?: number, pageSize?: number) => Promise<PageResult>` | Assignee/candidate pickers |
| `searchUserGroups` | `(name: string) => Promise<CamundaLookupItem[]>` | Candidate group pickers |
| `fetchProcessList` | `() => Promise<ProcessLookupItem[]>` | Call activity, DMN decision refs |
| `searchJavaClasses` | `(name: string) => Promise<CamundaLookupItem[]>` | Service task class picker |
| `searchDelegateExpressions` | `(name: string) => Promise<CamundaLookupItem[]>` | Delegate expression picker |
| `searchExternalTopics` | `(name: string) => Promise<CamundaLookupItem[]>` | External task topic picker |
| `searchDecisionRefs` | `(name: string) => Promise<ProcessLookupItem[]>` | Business rule task DMN picker |
| `searchFormRefs` | `(name: string) => Promise<ProcessLookupItem[]>` | Form reference picker |
| `searchFormKeys` | `(name: string) => Promise<CamundaLookupItem[]>` | Form key picker |

### Slots

| Slot | Description |
|------|-------------|
| `default` | Default slot for child components |

---

## BpmnModelerProcess

Full-featured BPMN 2.0 process designer with canvas, property panel, toolbar, and mode switching.

### Props

#### Theme & Language

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `'light' \| 'dark'` | `undefined` | Theme (falls back to provider) |
| `locale` | `string` | `undefined` | Locale (falls back to provider) |
| `localeFallback` | `string` | `undefined` | Fallback locale |
| `localeMessages` | `Record<string, Record<string, any>>` | `undefined` | Custom translations |
| `availableLocales` | `LocaleOption[]` | `[zh-CN, en-US]` | Locale selector options |

#### Canvas & Mode

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `xml` | `string` | `undefined` | Initial BPMN XML (auto-imported) |
| `proDesigner` | `boolean` | `true` | Professional mode (all nodes/properties) |
| `showDesignerSwitch` | `boolean` | `true` | Show Pro/Restricted toggle button |
| `designerConfig` | `DesignerConfig` | `undefined` | Restricted mode configuration |

#### Persistence

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `autoStash` | `boolean` | `true` | Auto-save XML to localStorage |
| `stashKey` | `string` | `'camunda7-ui:stash:xml'` | localStorage key |
| `size` | `'small' \| 'medium' \| 'large'` | `'small'` | Property panel form size |
| `extraTabLabels` | `Record<string, string>` | `{}` | Custom labels for extension tabs |

#### Callbacks (Data Source Integration)

| Prop | Type | Description |
|------|------|-------------|
| `onSaveXml` | `(xml: string) => void` | Called when user clicks Save |
| `onSearchUsers` | `(name, pageNo?, pageSize?) => PageResult` | Paginated user search |
| `onSearchUserGroups` | `(name) => CamundaLookupItem[]` | User group search |
| `onFetchProcessList` | `() => ProcessLookupItem[]` | Process definitions for call activity/DMN |
| `onSearchJavaClasses` | `(name) => CamundaLookupItem[]` | Java class search |
| `onSearchDelegateExpressions` | `(name) => CamundaLookupItem[]` | Delegate expression search |
| `onSearchExternalTopics` | `(name) => CamundaLookupItem[]` | External task topic search |
| `onSearchDecisionRefs` | `(name) => ProcessLookupItem[]` | DMN decision search |
| `onSearchFormRefs` | `(name) => ProcessLookupItem[]` | Form reference search |
| `onSearchFormKeys` | `(name) => CamundaLookupItem[]` | Form key search |
| `userResolver` | `string` | Expression for resolving assignees (default: `'approverResolver.getUsers'`) |
| `groupResolver` | `string` | Expression for resolving candidate groups (default: `'approverResolver.getUserGroups'`) |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:theme` | `theme: 'light' \| 'dark'` | Theme changed via toolbar |
| `update:locale` | `locale: string` | Locale changed via toolbar |
| `update:proDesigner` | `proDesigner: boolean` | Mode switched via toggle |

### Slots

All slots are forwarded to the internal `BpmnModelerProcessContent`.

| Slot | Context | Description |
|------|---------|-------------|
| `start-event-extra` | — | Extra tabs for Start Event properties |
| `end-event-extra` | — | Extra tabs for End Event properties |
| `intermediate-throw-event-extra` | — | Extra tabs for Intermediate Throw Event |
| `intermediate-catch-event-extra` | — | Extra tabs for Intermediate Catch Event |
| `task-extra` | — | Extra tabs for Task types (User, Service, Script, etc.) |
| `gateway-extra` | — | Extra tabs for Gateway properties |
| `buttons` | — | Custom buttons in ModelerToolbar (right side) |
| `footer` | — | Custom content in DesignerSwitch footer |

#### Slot Usage Example

```vue
<BpmnModelerProcess :xml="xml" @save-xml="save">
  <template #buttons>
    <n-button @click="customAction">Custom</n-button>
  </template>
  <template #task-extra="scope">
    <CustomTaskTab v-bind="scope" />
  </template>
</BpmnModelerProcess>
```

### Methods (via template ref)

```ts
const modelerRef = ref<InstanceType<typeof BpmnModelerProcess>>()

// Access underlying bpmn-js modeler instance
const bpmnModeler = modelerRef.value?.$el?.modelerRef // internal

// Or use composables directly in your component
import { useBpmnModeler } from '@zeng-alt/camunda7-ui'
```

> The component exposes `saveXml()`, `importXml(xml)`, `clearCanvas()`, `destroy()` via internal composable. For advanced use, access the modeler instance via `getModeler()` from `useBpmnModeler`.

---

## BpmnProcessViewer

Read-only process viewer with execution state visualization (highlighting, badges, timeline).

### Props

#### Theme & Language

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `'light' \| 'dark'` | `undefined` | Theme (falls back to provider) |
| `locale` | `string` | `undefined` | Locale (falls back to provider) |
| `localeFallback` | `string` | `undefined` | Fallback locale |
| `localeMessages` | `Record<string, Record<string, any>>` | `undefined` | Custom translations |
| `availableLocales` | `LocaleOption[]` | `[zh-CN, en-US]` | Locale selector options |

#### Data

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `processXml` | `string` | `''` | BPMN XML to display |
| `executionState` | `ProcessExecutionState \| null` | `null` | Execution state for highlighting |
| `showTimeline` | `boolean` | `false` | Show right-side timeline panel |

#### Callbacks

| Prop | Type | Description |
|------|------|-------------|
| `onSearchUsers` | `(name: string) => any` | Resolve assignee names in tooltips |
| `onSearchUserGroups` | `(name: string) => any` | Resolve candidate group names in tooltips |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:theme` | `theme: 'light' \| 'dark'` | Theme toggled via toolbar |
| `update:locale` | `locale: string` | Locale changed via toolbar |

### Slots

| Slot | Description |
|------|-------------|
| `default` | Not used (viewer has fixed layout) |

### Execution State Type

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
  sequenceFlows: Record<string, {
    status: 'pending' | 'active' | 'completed' | 'rejected'
  }>
}
```

### Methods (via template ref)

```ts
const viewerRef = ref<InstanceType<typeof BpmnProcessViewer>>()

// Programmatic control
viewerRef.value?.zoomIn()
viewerRef.value?.zoomOut()
viewerRef.value?.fitViewport()
```

---

## Internationalization (i18n)

All UI text uses the built-in lightweight i18n system (no `vue-i18n` required).

### Usage in Custom Components

```ts
import { useCamundaI18n } from '@zeng-alt/camunda7-ui'

const { t } = useCamundaI18n()
t('bpmnPanel.general.name') // 'Name'
t('bpmnPanel.tabs.userTask') // 'User Task'
```

### Locale Files

- `src/locales/zh.json` — Chinese (default)
- `src/locales/en.json` — English

### Custom Translations

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

## Theming

### Built-in Themes

- `light` — Default light theme
- `dark` — Dark mode

### Customization via UnoCSS

The library uses **UnoCSS** with a custom theme. Override CSS variables or extend `uno.config.ts`:

```ts
// uno.config.ts (in your app)
import { defineConfig } from 'unocss'
import presetCamunda7 from '@zeng-alt/camunda7-ui/uno-preset' // if published

export default defineConfig({
  presets: [
    presetCamunda7,
    // your overrides
  ],
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

### Naive UI Theme Override

The provider applies compact spacing overrides automatically. To customize further:

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

## Architecture Overview

```
src/
├── components/
│   ├── config-provider/          # CamundaConfigProvider
│   ├── bpmn-modeler-process/     # BpmnModelerProcess (editor)
│   │   ├── components/           # Toolbar, DesignerSwitch, Dialogs
│   │   ├── composables/          # useBpmnModeler, useXmlStash, useDiagramActions
│   │   └── features/configurable-nodes/  # Restricted mode palette
│   ├── bpmn-viewer/              # BpmnProcessViewer (read-only)
│   └── bpmn-panel/               # Property panels & base components
│       ├── base/                 # Reusable field components (GeneralPanel, FormPanel, etc.)
│       ├── task/                 # Task-specific extra fields
│       ├── events/               # Event-specific extra fields
│       ├── flow/                 # Sequence flow fields
│       └── callactivity/         # Call activity fields
├── composables/                  # Shared composables
│   ├── useBpmnProperties.ts      # Property panel helpers
│   ├── useFormSize.ts            # Form size scaling
│   ├── useMultiInstance.ts       # Multi-instance logic
│   └── useCamundaLookups.ts      # Scoped lookup injection
├── locales/                      # i18n (zh.json, en.json)
├── utils/bpmn/                   # BPMN helpers (elementType, uid, getDefinitions)
└── index.ts                      # Library entry (exports virtual:uno.css + all components)
```

---

## Development

```bash
# Install dependencies
pnpm install

# Start dev server (playground at http://localhost:5173)
pnpm dev

# Type-check + build library (outputs to dist/)
pnpm build

# Format code (oxfmt: no semicolons, single quotes)
pnpm format
```

### Playground

The `playground/` directory contains a demo app (`main.ts`, `App.vue`) that imports the library via the `camunda7-ui` alias (resolves to `src/index.ts`). Use it for manual testing.

### Project Structure

- **Library entry**: `src/index.ts` — exports `virtual:uno.css` side-effect + all components
- **Build**: Vite lib mode → `dist/camunda7-ui.{es,umd}.js`, `dist/camunda7-ui.css`, `dist/index.d.ts`
- **Externals** (not bundled): `vue`, `naive-ui`, `vue-i18n`, `@vueuse/core`
- **Formatter**: `oxfmt` — enforces no-semicolon + single-quote style (see `.oxfmtrc.json`)

---

## Publishing

```bash
pnpm build
cd dist
npm publish --access public
```

Only `dist/` is published (see `files` in `package.json`).

---

## License

AGPL-3.0-only — see [LICENSE](LICENSE) for details.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feat/amazing-feature`
5. Open a Pull Request

Please run `pnpm format` and `pnpm build` before submitting.

---

## Support

- 📖 **Documentation**: [GitHub Wiki](https://github.com/zeng-alt/camunda7-ui/wiki) (TODO)
- 🐛 **Issues**: [GitHub Issues](https://github.com/zeng-alt/camunda7-ui/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/zeng-alt/camunda7-ui/discussions)

---

## Acknowledgments

Built on top of amazing open-source projects:

- [camunda-bpmn-js](https://github.com/camunda/camunda-bpmn-js) — BPMN modeling toolkit
- [Naive UI](https://www.naiveui.com/) — Vue 3 component library
- [UnoCSS](https://unocss.dev/) — Atomic CSS engine
- [VueUse](https://vueuse.org/) — Composition API utilities