import { reactive } from 'vue'
import {
  useCamundaLookupsContext,
  type CamundaLookupsContext,
} from '../components/config-provider/context'
import type { FormSchema } from './useFormSchema'
import type { GlobalFormData } from '../components/bpmn-panel/base/globalForm'

/** 下拉选项的基础数据结构 */
export interface CamundaLookupItem {
  /** 展示文本 */
  label: string
  /** 选项值 */
  value: string
}

/** 分页查询结果 */
export interface PageResult {
  /** 当前页码 */
  pageNum: number
  /** 每页条数 */
  pageSize: number
  /** 当前页数据 */
  data: CamundaLookupItem[]
  /** 总条数 */
  total: number
}

/** 流程查找项：在基础项基础上附带可用版本 */
export interface ProcessLookupItem extends CamundaLookupItem {
  /** 流程可用版本列表 */
  version: string[]
}

/** 字典项：动态枚举查询结果 */
export interface CamundaDictItem {
  /** 展示文本 */
  label: string
  /** 选项值 */
  value: string
  /** 是否禁用 */
  disabled?: boolean
}

/**
 * 可供配置的数据源查找回调集合
 *
 * 每个字段对应一类远程数据查询，可为 null（未配置时使用内置空实现）。
 */
export interface CamundaLookups {
  /** 分页搜索用户 */
  searchUsers:
    | ((name: string, pageNo: number, pageSize: number) => Promise<PageResult> | PageResult)
    | null
  /** 搜索用户组 */
  searchUserGroups: ((name: string) => Promise<CamundaLookupItem[]> | CamundaLookupItem[]) | null
  /** 获取流程定义列表 */
  fetchProcessList: (() => Promise<ProcessLookupItem[]> | ProcessLookupItem[]) | null
  /** 搜索 Java 实现类 */
  searchJavaClasses: ((name: string) => Promise<CamundaLookupItem[]> | CamundaLookupItem[]) | null
  /** 搜索委托表达式 */
  searchDelegateExpressions:
    | ((name: string) => Promise<CamundaLookupItem[]> | CamundaLookupItem[])
    | null
  /** 搜索外部任务主题 */
  searchExternalTopics:
    | ((name: string) => Promise<CamundaLookupItem[]> | CamundaLookupItem[])
    | null
  /** 搜索 DMN 决策引用 */
  searchDecisionRefs: ((name: string) => Promise<ProcessLookupItem[]> | ProcessLookupItem[]) | null
  /** 搜索表单引用 */
  searchFormRefs: ((name: string) => Promise<ProcessLookupItem[]> | ProcessLookupItem[]) | null
  /** 搜索表单 Key */
  searchFormKeys: ((name: string) => Promise<CamundaLookupItem[]> | CamundaLookupItem[]) | null
  /** 加载全局表单字段结构：接收全局表单信息，返回字段树（可含对象/数组嵌套） */
  loadFormSchema: ((globalForm: GlobalFormData) => Promise<FormSchema> | FormSchema) | null
  /** 按字典编码查询字典项：用于枚举字段的动态 options */
  searchDictItems: ((code: string) => Promise<CamundaDictItem[]> | CamundaDictItem[]) | null
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
  loadFormSchema: null,
  searchDictItems: null,
})

/**
 * @description 获取数据源查找回调（lookups）。
 *
 * 优先返回最近的 `CamundaConfigProvider` 提供的作用域状态，
 * 未使用 Provider 时回退到模块级单例，并通过 `registerLookups` 合并配置。
 *
 * ## 用法
 *
 * ```ts
 * const { lookups, registerLookups } = useCamundaLookups()
 * registerLookups({ searchUsers: mySearch })
 * ```
 *
 * @returns 当前生效的 lookups 上下文，见 `CamundaLookupsContext`
 */
export function useCamundaLookups(): CamundaLookupsContext {
  const scoped = useCamundaLookupsContext()
  if (scoped) return scoped
  return {
    lookups: state,
    registerLookups: (lookups) => Object.assign(state, lookups),
  }
}
