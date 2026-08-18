export type ExecutionStatus = 'pending' | 'active' | 'completed' | 'rejected'

export interface NodeExecutionState {
  status: ExecutionStatus
  visitCount: number
  rejectCount: number
  assignee?: string
  candidateUsers?: string[]
  candidateGroups?: string[]
}

export interface ProcessExecutionState {
  processInstanceId: string
  elements: Record<string, NodeExecutionState>
  executionOrder?: string[]
  timestamps?: string[]
  results?: string[]
}

export interface TooltipData {
  elementId: string
  name: string
  type: string
  status: ExecutionStatus
  visitCount: number
  rejectCount: number
  assignee?: string
  candidateUsers?: string[]
  candidateGroups?: string[]
}

/** 传给用户自定义渲染的用户信息（办理人/候选，含解析后的名称） */
export interface ViewerUserInfo {
  /** 办理人 id */
  assignee?: string
  /** 候选办理人 id 列表 */
  candidateUsers?: string[]
  /** 候选用户组 id 列表 */
  candidateGroups?: string[]
  /** 候选办理人解析后的名称列表 */
  resolvedUsers?: { value: string; label: string }[]
  /** 候选用户组解析后的名称列表 */
  resolvedGroups?: { value: string; label: string }[]
}
