# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.6] - 2026-08-15

### Added

- **Token 仿真（bpmn-js-token-simulation）中文化**：新增 `useTokenSimulationI18n` 组合式函数，通过
  MutationObserver 监听画布容器，将仿真调色板（开始/暂停、重置、切换日志）、上下文面板
  （触发事件、添加/移除暂停点、设置顺序流）、仿真日志（标题、空状态、完成/取消记录、
  元素类型兜底名）、通知（开始/暂停/重置仿真、不支持的流程元素等）、动画速度 tooltip
  及聚焦流程实例等硬编码英文文案替换为中文，并支持运行时切换语言后重新翻译。
- **AI 助手**：工具栏新增 AI 助手入口与 `AiChatDialog`，通过 `aiChat` 回调接入任意
  OpenAI 兼容实现（内置 `createOpenAiAdapter`），支持自然语言修改流程并一键应用到画布。
- **元素搜索面板**：工具栏新增搜索入口，支持按元素名称/ID/类型模糊搜索并定位元素。
- **消息流属性面板**：新增 `MessageFlowPropertiesPanel`（名称 / messageRef）。
- **事件子流程开关**：子流程新增 `triggeredByEvent` 开关。
- **事务字段**：事务子流程新增事务方法（requiresNew/requiresOwn/requiresAll）与协议字段。
- **表达式校验**：新增零依赖表达式校验器（`expression-validator`），支持 `${}` / `#{}`
  与 ISO 8601 定时器值的静态校验，并内置 `camunda7/expression-syntax` lint 规则。
- **发起人默认值**：开始事件恢复发起人（initiator）字段的默认值与强制 lint 规则。
- **快捷键**：支持 Ctrl/Cmd+S 保存（激活 `onSaveXml`）、Ctrl/Cmd+F 切换元素搜索。

### Changed

- 用户任务高级面板新增候选用户选择器。
- 清空画布时保留当前流程的 ID 与名称。

### Removed

- 移除开始事件发起人配置字段及 `startEventInitiator` prop 与 `start-event-no-initiator` lint 规则。
