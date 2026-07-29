import { reactive } from 'vue'

export interface CamundaLookupItem {
  label: string
  value: string
}

export interface PageResult {
  pageNum: number
  pageSize: number
  data: CamundaLookupItem[]
  total: number
}

export interface ProcessLookupItem extends CamundaLookupItem {
  version: string[]
}

export interface CamundaLookups {
  searchUsers:
    | ((name: string, pageNo: number, pageSize: number) => Promise<PageResult> | PageResult)
    | null
  searchUserGroups: ((name: string) => Promise<CamundaLookupItem[]> | CamundaLookupItem[]) | null
  fetchProcessList: (() => Promise<ProcessLookupItem[]> | ProcessLookupItem[]) | null
  searchJavaClasses: ((name: string) => Promise<CamundaLookupItem[]> | CamundaLookupItem[]) | null
  searchDelegateExpressions:
    | ((name: string) => Promise<CamundaLookupItem[]> | CamundaLookupItem[])
    | null
  searchExternalTopics:
    | ((name: string) => Promise<CamundaLookupItem[]> | CamundaLookupItem[])
    | null
  searchDecisionRefs: ((name: string) => Promise<ProcessLookupItem[]> | ProcessLookupItem[]) | null
  searchFormRefs: ((name: string) => Promise<ProcessLookupItem[]> | ProcessLookupItem[]) | null
  searchFormKeys: ((name: string) => Promise<CamundaLookupItem[]> | CamundaLookupItem[]) | null
}

const state = reactive<CamundaLookups>({
  searchUsers: null,
  searchUserGroups: null,
  fetchProcessList: null,
  searchJavaClasses: null,
  searchDelegateExpressions: null,
  searchExternalTopics: null,
  searchDecisionRefs: null,
  searchFormRefs: null,
  searchFormKeys: null,
})

export function useCamundaLookups() {
  function registerLookups(lookups: Partial<CamundaLookups>) {
    Object.assign(state, lookups)
  }

  return {
    lookups: state,
    registerLookups,
  }
}
