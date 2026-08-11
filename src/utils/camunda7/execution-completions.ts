import type { Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete'
import { syntaxTree } from '@codemirror/language'
import type { HoverTooltipSource, Tooltip } from '@codemirror/view'

interface ContextMember {
  label: string
  detail: string
  info: string
  apply?: string
}

interface ContextDef {
  prefix: string
  title: string
  info: string
  methods: ContextMember[]
  properties: ContextMember[]
}

function toMethodCompletion(m: ContextMember): Completion {
  return {
    label: m.label,
    type: 'method',
    detail: m.detail,
    info: m.info,
    apply: m.apply ?? m.label,
  }
}

function toPropertyCompletion(m: ContextMember): Completion {
  return {
    label: m.label,
    type: 'property',
    detail: m.detail,
    info: m.info,
  }
}

function isDark(): boolean {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
}

function tooltipStyle(): string {
  const dark = isDark()
  const bg = dark ? '#252526' : '#fff'
  const border = dark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)'
  const shadow = dark ? '0 8px 24px rgba(0,0,0,.4)' : '0 8px 24px rgba(0,0,0,.12)'
  return `max-width:360px;padding:10px 14px;background:${bg};border:1px solid ${border};border-radius:8px;box-shadow:${shadow};font-size:12px;line-height:1.7;`
}

function tooltipHtml(
  prefix: string,
  label: string,
  typeLabel: string | null,
  info: string,
): string {
  const dark = isDark()
  const titleColor = dark ? '#e1e4e8' : '#1a1a2e'
  const infoColor = dark ? '#8b949e' : '#57606a'
  const typeTag = typeLabel
    ? `<span style="font-size:10px;color:#8b949e;margin-left:8px;font-weight:400;font-family:inherit">${typeLabel}</span>`
    : ''
  const labelPart = label ? '.' + label : ''
  return `<div style="font-weight:600;color:${titleColor};font-family:Menlo,Consolas,monospace;margin-bottom:4px">${prefix}${labelPart}${typeTag}</div><div style="color:${infoColor};font-size:11px;line-height:1.5">${info}</div>`
}

function makeCompletionSource(ctx: ContextDef) {
  const { prefix, methods, properties } = ctx

  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(new RegExp(`${prefix.replace('.', '\\.')}\\.\\w*`))
    if (!word || (word.from === word.to && !context.explicit)) return null

    const afterDot = word.text.slice(prefix.length + 1)

    const matchedMethods = methods
      .filter((m) => m.label.startsWith(afterDot))
      .map(toMethodCompletion)
    const matchedProps = properties
      .filter((p) => p.label.startsWith(afterDot))
      .map(toPropertyCompletion)

    const result = [...matchedMethods, ...matchedProps]
    if (result.length === 0) return null

    return {
      from: word.from + prefix.length + 1,
      options: result,
      validFor: /^\w*$/,
    }
  }
}

function makeMemberMap(ctx: ContextDef): Map<string, ContextMember> {
  const map = new Map<string, ContextMember>()
  ctx.methods.forEach((m) => map.set(m.label, m))
  ctx.properties.forEach((m) => map.set(m.label, m))
  return map
}

function makeHoverTooltip(ctx: ContextDef): HoverTooltipSource {
  const { prefix } = ctx
  const memberMap = makeMemberMap(ctx)

  return (view, pos): Tooltip | null => {
    const tree = syntaxTree(view.state)
    const node = tree.resolveInner(pos, -1)

    const text = view.state.sliceDoc(node.from, node.to)
    const match = text.match(new RegExp(`^${prefix.replace('.', '\\.')}\\.(\\w+)$`))
    if (!match) return null

    const memberName = match[1]
    const member = memberName ? memberMap.get(memberName) : undefined
    if (!member) return null

    return {
      pos: node.from,
      end: node.to,
      above: true,
      create() {
        const dom = document.createElement('div')
        dom.className = 'cm-execution-tooltip'
        dom.style.cssText = tooltipStyle()
        const typeLabel = member.apply ? '方法' : '属性'
        dom.innerHTML = tooltipHtml(prefix, member.label, typeLabel, member.info)
        return { dom }
      },
    }
  }
}

// ─── Context definitions ────────────────────────────────────────────

const executionCtx: ContextDef = {
  prefix: 'execution',
  title: '流程上下文',
  info: 'DelegateExecution — 流程执行上下文，可读写流程变量、获取实例信息',
  methods: [
    {
      label: 'getVariable',
      detail: '(variableName: string) => Object',
      info: '获取指定名称的流程变量（含父作用域）',
      apply: 'getVariable("")',
    },
    {
      label: 'setVariable',
      detail: '(variableName: string, value: any) => void',
      info: '设置流程变量',
      apply: 'setVariable("", )',
    },
    {
      label: 'hasVariable',
      detail: '(variableName: string) => boolean',
      info: '检查指定名称的流程变量是否存在',
      apply: 'hasVariable("")',
    },
    {
      label: 'removeVariable',
      detail: '(variableName: string) => void',
      info: '删除指定名称的流程变量',
      apply: 'removeVariable("")',
    },
    {
      label: 'getVariableLocal',
      detail: '(variableName: string) => Object',
      info: '获取本地作用域的流程变量',
      apply: 'getVariableLocal("")',
    },
    {
      label: 'setVariableLocal',
      detail: '(variableName: string, value: any) => void',
      info: '设置本地作用域的流程变量',
      apply: 'setVariableLocal("", )',
    },
    {
      label: 'hasVariableLocal',
      detail: '(variableName: string) => boolean',
      info: '检查本地作用域的流程变量是否存在',
      apply: 'hasVariableLocal("")',
    },
    {
      label: 'removeVariableLocal',
      detail: '(variableName: string) => void',
      info: '删除本地作用域的流程变量',
      apply: 'removeVariableLocal("")',
    },
    {
      label: 'getVariableTyped',
      detail: '(variableName: string) => TypedValue',
      info: '获取带类型信息的流程变量',
      apply: 'getVariableTyped("")',
    },
    {
      label: 'setVariableTyped',
      detail: '(variableName: string, value: TypedValue) => void',
      info: '设置带类型信息的流程变量',
      apply: 'setVariableTyped("", )',
    },
    {
      label: 'getVariableLocalTyped',
      detail: '(variableName: string) => TypedValue',
      info: '获取本地带类型信息的流程变量',
      apply: 'getVariableLocalTyped("")',
    },
    {
      label: 'setVariableLocalTyped',
      detail: '(variableName: string, value: TypedValue) => void',
      info: '设置本地带类型信息的流程变量',
      apply: 'setVariableLocalTyped("", )',
    },
    {
      label: 'getVariables',
      detail: '() => { [key: string]: any }',
      info: '获取所有流程变量',
      apply: 'getVariables()',
    },
    {
      label: 'getVariablesLocal',
      detail: '() => { [key: string]: any }',
      info: '获取所有本地流程变量',
      apply: 'getVariablesLocal()',
    },
    {
      label: 'getVariablesTyped',
      detail: '() => { [key: string]: TypedValue }',
      info: '获取所有带类型信息的流程变量',
      apply: 'getVariablesTyped()',
    },
    {
      label: 'getVariablesLocalTyped',
      detail: '() => { [key: string]: TypedValue }',
      info: '获取所有本地带类型信息的流程变量',
      apply: 'getVariablesLocalTyped()',
    },
    {
      label: 'setVariables',
      detail: '(variables: { [key: string]: any }) => void',
      info: '批量设置流程变量',
      apply: 'setVariables({})',
    },
    {
      label: 'setVariablesLocal',
      detail: '(variables: { [key: string]: any }) => void',
      info: '批量设置本地流程变量',
      apply: 'setVariablesLocal({})',
    },
    {
      label: 'getProcessInstanceId',
      detail: '() => string',
      info: '获取流程实例 ID',
      apply: 'getProcessInstanceId()',
    },
    {
      label: 'getProcessBusinessKey',
      detail: '() => string',
      info: '获取流程实例的 Business Key',
      apply: 'getProcessBusinessKey()',
    },
    {
      label: 'getProcessDefinitionId',
      detail: '() => string',
      info: '获取流程定义 ID',
      apply: 'getProcessDefinitionId()',
    },
    {
      label: 'getCurrentActivityId',
      detail: '() => string',
      info: '获取当前活动节点 ID',
      apply: 'getCurrentActivityId()',
    },
    {
      label: 'getCurrentActivityName',
      detail: '() => string',
      info: '获取当前活动节点名称',
      apply: 'getCurrentActivityName()',
    },
    {
      label: 'getActivityInstanceId',
      detail: '() => string',
      info: '获取当前活动实例 ID',
      apply: 'getActivityInstanceId()',
    },
    {
      label: 'getParentId',
      detail: '() => string',
      info: '获取父执行实例 ID',
      apply: 'getParentId()',
    },
    {
      label: 'getParentActivityInstanceId',
      detail: '() => string',
      info: '获取父活动实例 ID',
      apply: 'getParentActivityInstanceId()',
    },
    { label: 'getId', detail: '() => string', info: '获取当前执行实例 ID', apply: 'getId()' },
    {
      label: 'getEventName',
      detail: '() => string',
      info: '获取当前触发的事件名称',
      apply: 'getEventName()',
    },
    {
      label: 'getBusinessKey',
      detail: '() => string',
      info: '获取当前执行实例的 Business Key',
      apply: 'getBusinessKey()',
    },
    { label: 'getTenantId', detail: '() => string', info: '获取租户 ID', apply: 'getTenantId()' },
    {
      label: 'getCurrentTransitionId',
      detail: '() => string',
      info: '获取当前迁移 ID',
      apply: 'getCurrentTransitionId()',
    },
  ],
  properties: [
    { label: 'processInstanceId', detail: 'string', info: '当前流程实例 ID' },
    { label: 'processBusinessKey', detail: 'string', info: '当前流程实例的 Business Key' },
    { label: 'processDefinitionId', detail: 'string', info: '当前流程定义 ID' },
    { label: 'id', detail: 'string', info: '当前执行实例 ID' },
    { label: 'eventName', detail: 'string', info: '当前触发的事件名称' },
    { label: 'businessKey', detail: 'string', info: '当前执行实例的 Business Key' },
    { label: 'tenantId', detail: 'string', info: '当前租户 ID' },
    { label: 'currentActivityId', detail: 'string', info: '当前活动节点 ID' },
    { label: 'currentActivityName', detail: 'string', info: '当前活动节点名称' },
    { label: 'activityInstanceId', detail: 'string', info: '当前活动实例 ID' },
    { label: 'parentId', detail: 'string', info: '父执行实例 ID' },
    { label: 'parentActivityInstanceId', detail: 'string', info: '父活动实例 ID' },
    { label: 'currentTransitionId', detail: 'string', info: '当前迁移 ID' },
  ],
}

const taskCtx: ContextDef = {
  prefix: 'task',
  title: '任务信息',
  info: 'DelegateTask — 任务监听器上下文，可管理任务处理人、优先级、评论等',
  methods: [
    {
      label: 'getAssignee',
      detail: '() => string',
      info: '获取任务处理人',
      apply: 'getAssignee()',
    },
    {
      label: 'setAssignee',
      detail: '(userId: string) => void',
      info: '设置任务处理人',
      apply: 'setAssignee("")',
    },
    { label: 'getOwner', detail: '() => string', info: '获取任务所有者', apply: 'getOwner()' },
    {
      label: 'setOwner',
      detail: '(userId: string) => void',
      info: '设置任务所有者',
      apply: 'setOwner("")',
    },
    {
      label: 'addCandidateUser',
      detail: '(userId: string) => void',
      info: '添加候选人',
      apply: 'addCandidateUser("")',
    },
    {
      label: 'addCandidateGroup',
      detail: '(groupId: string) => void',
      info: '添加候选组',
      apply: 'addCandidateGroup("")',
    },
    {
      label: 'addCandidateUsers',
      detail: '(userIds: string[]) => void',
      info: '批量添加候选人',
      apply: 'addCandidateUsers([])',
    },
    {
      label: 'addCandidateGroups',
      detail: '(groupIds: string[]) => void',
      info: '批量添加候选组',
      apply: 'addCandidateGroups([])',
    },
    {
      label: 'deleteCandidateUser',
      detail: '(userId: string) => void',
      info: '移除候选人',
      apply: 'deleteCandidateUser("")',
    },
    {
      label: 'deleteCandidateGroup',
      detail: '(groupId: string) => void',
      info: '移除候选组',
      apply: 'deleteCandidateGroup("")',
    },
    {
      label: 'setPriority',
      detail: '(priority: number) => void',
      info: '设置任务优先级',
      apply: 'setPriority()',
    },
    {
      label: 'getPriority',
      detail: '() => number',
      info: '获取任务优先级',
      apply: 'getPriority()',
    },
    {
      label: 'setDueDate',
      detail: '(date: Date) => void',
      info: '设置任务到期时间',
      apply: 'setDueDate()',
    },
    { label: 'getDueDate', detail: '() => Date', info: '获取任务到期时间', apply: 'getDueDate()' },
    {
      label: 'setFollowUpDate',
      detail: '(date: Date) => void',
      info: '设置任务跟进时间',
      apply: 'setFollowUpDate()',
    },
    {
      label: 'getFollowUpDate',
      detail: '() => Date',
      info: '获取任务跟进时间',
      apply: 'getFollowUpDate()',
    },
    {
      label: 'addComment',
      detail: '(comment: string) => void',
      info: '添加任务评论',
      apply: 'addComment("")',
    },
    {
      label: 'getComments',
      detail: '() => Comment[]',
      info: '获取所有任务评论',
      apply: 'getComments()',
    },
    {
      label: 'deleteComment',
      detail: '(commentId: string) => void',
      info: '删除任务评论',
      apply: 'deleteComment("")',
    },
    { label: 'complete', detail: '() => void', info: '完成当前任务', apply: 'complete()' },
    { label: 'save', detail: '() => void', info: '保存任务变更', apply: 'save()' },
    {
      label: 'getTaskLocalVariables',
      detail: '() => { [key: string]: any }',
      info: '获取任务本地变量',
      apply: 'getTaskLocalVariables()',
    },
    {
      label: 'setTaskLocalVariables',
      detail: '(vars: { [key: string]: any }) => void',
      info: '设置任务本地变量',
      apply: 'setTaskLocalVariables({})',
    },
    {
      label: 'getExecutionId',
      detail: '() => string',
      info: '获取关联的执行实例 ID',
      apply: 'getExecutionId()',
    },
  ],
  properties: [
    { label: 'id', detail: 'string', info: '任务 ID' },
    { label: 'name', detail: 'string', info: '任务名称' },
    { label: 'description', detail: 'string', info: '任务描述' },
    { label: 'assignee', detail: 'string', info: '当前处理人' },
    { label: 'owner', detail: 'string', info: '任务所有者' },
    { label: 'createTime', detail: 'Date', info: '任务创建时间' },
    { label: 'dueDate', detail: 'Date', info: '任务到期时间' },
    { label: 'followUpDate', detail: 'Date', info: '任务跟进时间' },
    { label: 'priority', detail: 'number', info: '优先级 (0-100)' },
    { label: 'executionId', detail: 'string', info: '关联的执行实例 ID' },
    { label: 'processInstanceId', detail: 'string', info: '流程实例 ID' },
    { label: 'processDefinitionId', detail: 'string', info: '流程定义 ID' },
    { label: 'taskDefinitionKey', detail: 'string', info: '任务定义 Key' },
    { label: 'caseInstanceId', detail: 'string', info: 'Case 实例 ID' },
    { label: 'caseExecutionId', detail: 'string', info: 'Case 执行 ID' },
    { label: 'caseDefinitionId', detail: 'string', info: 'Case 定义 ID' },
    { label: 'delegationState', detail: 'string', info: '委托状态 (PENDING/RESOLVED)' },
    { label: 'tenantId', detail: 'string', info: '租户 ID' },
    { label: 'formKey', detail: 'string', info: '表单 Key' },
  ],
}

const variablesCtx: ContextDef = {
  prefix: 'variable',
  title: '流程变量',
  info: 'DelegateVariable — 流程变量读写操作，支持 get/set/remove/has 等',
  methods: [
    {
      label: 'get',
      detail: '(variableName: string) => Object',
      info: '获取流程变量值',
      apply: 'get("")',
    },
    {
      label: 'getTyped',
      detail: '(variableName: string) => TypedValue',
      info: '获取带类型信息的流程变量',
      apply: 'getTyped("")',
    },
    {
      label: 'set',
      detail: '(variableName: string, value: any) => void',
      info: '设置流程变量',
      apply: 'set("", )',
    },
    {
      label: 'setTyped',
      detail: '(variableName: string, value: TypedValue) => void',
      info: '设置带类型的流程变量',
      apply: 'setTyped("", )',
    },
    {
      label: 'remove',
      detail: '(variableName: string) => void',
      info: '删除流程变量',
      apply: 'remove("")',
    },
    {
      label: 'has',
      detail: '(variableName: string) => boolean',
      info: '检查流程变量是否存在',
      apply: 'has("")',
    },
    {
      label: 'getAll',
      detail: '() => { [key: string]: any }',
      info: '获取所有流程变量',
      apply: 'getAll()',
    },
    { label: 'removeAll', detail: '() => void', info: '删除所有流程变量', apply: 'removeAll()' },
    {
      label: 'containsKey',
      detail: '(key: string) => boolean',
      info: '检查变量名是否存在',
      apply: 'containsKey("")',
    },
    { label: 'keys', detail: '() => string[]', info: '获取所有变量名', apply: 'keys()' },
    { label: 'size', detail: '() => number', info: '获取变量数量', apply: 'size()' },
    { label: 'isEmpty', detail: '() => boolean', info: '检查变量集是否为空', apply: 'isEmpty()' },
  ],
  properties: [],
}

const inputParameterCtx: ContextDef = {
  prefix: 'inputParameter',
  title: '节点输入',
  info: '连接器输入参数 Map，支持 get/put/remove/keySet 等操作',
  methods: [
    { label: 'get', detail: '(key: string) => Object', info: '获取输入参数值', apply: 'get("")' },
    {
      label: 'put',
      detail: '(key: string, value: any) => Object',
      info: '设置输入参数',
      apply: 'put("", )',
    },
    {
      label: 'remove',
      detail: '(key: string) => Object',
      info: '移除输入参数',
      apply: 'remove("")',
    },
    {
      label: 'containsKey',
      detail: '(key: string) => boolean',
      info: '检查 Key 是否存在',
      apply: 'containsKey("")',
    },
    {
      label: 'containsValue',
      detail: '(value: any) => boolean',
      info: '检查 Value 是否存在',
      apply: 'containsValue()',
    },
    { label: 'keySet', detail: '() => string[]', info: '获取所有参数名集合', apply: 'keySet()' },
    { label: 'values', detail: '() => any[]', info: '获取所有参数值集合', apply: 'values()' },
    { label: 'entrySet', detail: '() => Entry[]', info: '获取所有键值对集合', apply: 'entrySet()' },
    { label: 'size', detail: '() => number', info: '获取参数数量', apply: 'size()' },
    { label: 'isEmpty', detail: '() => boolean', info: '检查参数集是否为空', apply: 'isEmpty()' },
    { label: 'clear', detail: '() => void', info: '清空所有输入参数', apply: 'clear()' },
    {
      label: 'putAll',
      detail: '(map: { [key: string]: any }) => void',
      info: '批量添加输入参数',
      apply: 'putAll({})',
    },
  ],
  properties: [],
}

const outputParameterCtx: ContextDef = {
  prefix: 'outputParameter',
  title: '节点输出',
  info: '连接器输出参数 Map，支持 get/put/remove/keySet 等操作',
  methods: [
    { label: 'get', detail: '(key: string) => Object', info: '获取输出参数值', apply: 'get("")' },
    {
      label: 'put',
      detail: '(key: string, value: any) => Object',
      info: '设置输出参数',
      apply: 'put("", )',
    },
    {
      label: 'remove',
      detail: '(key: string) => Object',
      info: '移除输出参数',
      apply: 'remove("")',
    },
    {
      label: 'containsKey',
      detail: '(key: string) => boolean',
      info: '检查 Key 是否存在',
      apply: 'containsKey("")',
    },
    {
      label: 'containsValue',
      detail: '(value: any) => boolean',
      info: '检查 Value 是否存在',
      apply: 'containsValue()',
    },
    { label: 'keySet', detail: '() => string[]', info: '获取所有参数名集合', apply: 'keySet()' },
    { label: 'values', detail: '() => any[]', info: '获取所有参数值集合', apply: 'values()' },
    { label: 'entrySet', detail: '() => Entry[]', info: '获取所有键值对集合', apply: 'entrySet()' },
    { label: 'size', detail: '() => number', info: '获取参数数量', apply: 'size()' },
    { label: 'isEmpty', detail: '() => boolean', info: '检查参数集是否为空', apply: 'isEmpty()' },
    { label: 'clear', detail: '() => void', info: '清空所有输出参数', apply: 'clear()' },
    {
      label: 'putAll',
      detail: '(map: { [key: string]: any }) => void',
      info: '批量添加输出参数',
      apply: 'putAll({})',
    },
  ],
  properties: [],
}

// ─── All contexts ────────────────────────────────────────────────────

const allContexts: ContextDef[] = [
  executionCtx,
  taskCtx,
  variablesCtx,
  inputParameterCtx,
  outputParameterCtx,
]

// ─── Exported completion sources ─────────────────────────────────────

export const executionCompletionSource = makeCompletionSource(executionCtx)
export const taskCompletionSource = makeCompletionSource(taskCtx)
export const variablesCompletionSource = makeCompletionSource(variablesCtx)
export const inputParameterCompletionSource = makeCompletionSource(inputParameterCtx)
export const outputParameterCompletionSource = makeCompletionSource(outputParameterCtx)

export const allCompletionSources = [
  executionCompletionSource,
  taskCompletionSource,
  variablesCompletionSource,
  inputParameterCompletionSource,
  outputParameterCompletionSource,
]

export const contextKeywordCompletionSource = (
  context: CompletionContext,
): CompletionResult | null => {
  const word = context.matchBefore(/[\w\u4e00-\u9fff]+/)
  if (!word || (word.from === word.to && !context.explicit)) return null

  const text = word.text.toLowerCase()
  const afterDot = context.state.sliceDoc(word.to, word.to + 1)
  if (afterDot === '.') return null

  const matches = allContexts
    .filter((ctx) => ctx.prefix.toLowerCase().startsWith(text) && ctx.prefix !== word.text)
    .map((ctx) => ({
      label: ctx.prefix,
      type: 'keyword' as const,
      detail: ctx.title,
      info: ctx.info,
      boost: 4,
    }))

  if (matches.length === 0) return null

  return {
    from: word.from,
    options: matches,
    validFor: /^\w*$/,
  }
}

// ─── Exported hover tooltips ─────────────────────────────────────────

export const executionHoverTooltip = makeHoverTooltip(executionCtx)
export const taskHoverTooltip = makeHoverTooltip(taskCtx)
export const variablesHoverTooltip = makeHoverTooltip(variablesCtx)
export const inputParameterHoverTooltip = makeHoverTooltip(inputParameterCtx)
export const outputParameterHoverTooltip = makeHoverTooltip(outputParameterCtx)

const contextKeywordMap = new Map(allContexts.map((c) => [c.prefix, c]))

export const contextKeywordHoverTooltip: HoverTooltipSource = (view, pos): Tooltip | null => {
  const tree = syntaxTree(view.state)
  const node = tree.resolveInner(pos, -1)
  const text = view.state.sliceDoc(node.from, node.to)
  if (!/^\w+$/.test(text)) return null

  const ctx = contextKeywordMap.get(text)
  if (!ctx) return null

  return {
    pos: node.from,
    end: node.to,
    above: true,
    create() {
      const dom = document.createElement('div')
      dom.className = 'cm-execution-tooltip'
      dom.style.cssText = tooltipStyle()
      dom.innerHTML = tooltipHtml(ctx.prefix, '', ctx.title, ctx.info)
      return { dom }
    },
  }
}

export const allHoverTooltips = [
  executionHoverTooltip,
  taskHoverTooltip,
  variablesHoverTooltip,
  inputParameterHoverTooltip,
  outputParameterHoverTooltip,
  contextKeywordHoverTooltip,
]

export function combinedCompletionSource(context: CompletionContext): CompletionResult | null {
  for (const source of allCompletionSources) {
    const result = source(context)
    if (result) return result
  }
  const keywordResult = contextKeywordCompletionSource(context)
  if (keywordResult) return keywordResult
  return null
}
