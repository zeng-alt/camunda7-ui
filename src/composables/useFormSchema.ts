import { ref, type Ref } from 'vue'
import { useFormSchemaContext } from '../components/config-provider/context'
import type { GlobalFormData } from '../components/bpmn-panel/base/globalForm'

export type FormSchemaType =
  | 'string'
  | 'long'
  | 'double'
  | 'boolean'
  | 'date'
  | 'enum'
  | 'object'
  | 'array'

export interface FormSchemaEnumValue {
  id: string
  name: string
}

/** 字典项：label 展示文本、value 存储值、disabled 是否禁用 */
export interface FormSchemaEnumOption {
  label: string
  value: string
  disabled?: boolean
}

/** 动态字典：需按 code 调用 searchDictItems 查询 */
export interface FormSchemaDynamicOptions {
  dynamic: true
  /** 字典编码，传给 searchDictItems 查询 */
  code: string
  /** 展示名称 */
  label?: string
}

/** 枚举的 options：字符串数组 / {label,value} 数组 / 动态字典 */
export type FormSchemaEnumOptions = string[] | FormSchemaEnumOption[] | FormSchemaDynamicOptions

export interface FormSchemaField {
  /** 字段名（同级内唯一，用于拼接路径） */
  name: string
  /** 展示名称，缺省使用 name */
  label?: string
  /** 字段类型：标量 / 枚举 / 日期 / 对象 / 数组 */
  type: FormSchemaType
  /** date 类型的时间格式，如 yyyy-MM-dd、yyyy-MM-dd HH:mm:ss */
  datePattern?: string
  /** enum 类型的枚举项 */
  enumValues?: FormSchemaEnumValue[]
  /** enum 类型的 options（字符串 / {label,value} / 动态字典） */
  options?: FormSchemaEnumOptions
  /** object 类型的子字段 */
  children?: FormSchemaField[]
  /** array 类型的元素字段 */
  items?: FormSchemaField
}

export type FormSchema = FormSchemaField[]

/** 全局表单结构加载器：接收当前全局表单信息，返回字段结构（可含对象/数组嵌套） */
export type FormSchemaLoader = (globalForm: GlobalFormData) => FormSchema | Promise<FormSchema>

export interface FormSchemaContext {
  schema: Ref<FormSchema>
  setSchema: (schema: FormSchema) => void
}

const moduleSchema = ref<FormSchema>([])
const moduleState: FormSchemaContext = {
  schema: moduleSchema,
  setSchema: (schema) => {
    moduleSchema.value = schema
  },
}

/**
 * 读取全局表单字段结构（schema）。
 *
 * 优先返回最近的 `CamundaConfigProvider` 提供的作用域状态，
 * 未使用 Provider 时回退到模块级单例。配合 `setSchema` 写入加载结果。
 */
export function useFormSchema(): FormSchemaContext {
  const scoped = useFormSchemaContext()
  if (scoped) return scoped
  return moduleState
}
