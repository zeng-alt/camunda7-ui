export type ExecutionStatus = 'pending' | 'active' | 'completed' | 'rejected'

export interface NodeExecutionState {
  status: ExecutionStatus
  visitCount: number
  rejectCount: number
  assignee?: string
  candidateUsers?: string[]
  candidateGroups?: string[]
}

export interface FlowExecutionState {
  status: ExecutionStatus
  visitCount: number
}

export interface ProcessExecutionState {
  processInstanceId: string
  elements: Record<string, NodeExecutionState>
  sequenceFlows: Record<string, FlowExecutionState>
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
