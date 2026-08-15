import type { FormSchema, FormSchemaField } from '../composables/useFormSchema'

/**
 * 对象/数组整体选择用标记后缀：
 * - `~container`：级联里可展开的容器节点（不可选，仅用于 hover/展开）
 * - `~self`：代表整个对象/数组的叶子节点（可选，选中后还原为真实路径）
 */
const WHOLE_MARKER = '~self'
const CONTAINER_MARKER = '~container'

export interface SchemaCascaderOption {
  label: string
  value: string
  isLeaf: boolean
  disabled?: boolean
  children?: SchemaCascaderOption[]
  [key: string]: unknown
}

export interface BuildCascaderOptionsOptions {
  /** 对象/数组“整体”叶子的文案，如 “整体” */
  wholeLabel?: string
}

function isContainer(field: FormSchemaField): boolean {
  return field.type === 'object' || field.type === 'array'
}

function buildFieldOptions(
  field: FormSchemaField,
  path: string,
  wholeLabel: string,
): SchemaCascaderOption {
  if (isContainer(field)) {
    return {
      label: field.label || field.name,
      value: path + CONTAINER_MARKER,
      isLeaf: false,
      children: [
        {
          label: wholeLabel || field.label || field.name,
          value: path + WHOLE_MARKER,
          isLeaf: true,
        },
        ...buildContainerChildren(field, path, wholeLabel),
      ],
    }
  }
  return { label: field.label || field.name, value: path, isLeaf: true }
}

function buildContainerChildren(
  field: FormSchemaField,
  path: string,
  wholeLabel: string,
): SchemaCascaderOption[] {
  if (field.type === 'object') {
    return (field.children || []).map((child) =>
      buildFieldOptions(child, `${path}.${child.name}`, wholeLabel),
    )
  }
  const item = field.items
  if (!item) return []
  const itemPath = `${path}[]`
  if (isContainer(item)) {
    return [buildFieldOptions(item, itemPath, wholeLabel)]
  }
  return [{ label: item.label || item.name, value: itemPath, isLeaf: true }]
}

/** 把 schema 树转成级联选择器选项；选中值可通过 cascaderValueToStoredPath 还原为字段路径 */
export function buildCascaderOptions(
  schema: FormSchema,
  options: BuildCascaderOptionsOptions = {},
): SchemaCascaderOption[] {
  const wholeLabel = options.wholeLabel || ''
  return (schema || []).map((field) => buildFieldOptions(field, field.name, wholeLabel))
}

/**
 * 按路径解析字段。路径规则：
 * - 对象子字段：`a.b`
 * - 数组整体：`arr`
 * - 标量数组元素：`arr[]`
 * - 对象数组元素字段：`arr[].name`
 */
export function resolveFieldByPath(schema: FormSchema, path: string): FormSchemaField | null {
  if (!path) return null
  const segments = path.split('.')
  let list = schema || []
  let current: FormSchemaField | null = null
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i] || ''
    if (seg.endsWith('[]')) {
      const name = seg.slice(0, -2)
      const field = list.find((f) => f.name === name)
      if (!field || field.type !== 'array' || !field.items) return null
      current = field.items
      if (i < segments.length - 1) {
        list = field.items.children || []
      }
    } else {
      const field = list.find((f) => f.name === seg)
      if (!field) return null
      current = field
      if (i < segments.length - 1) {
        list = field.children || []
      }
    }
  }
  return current
}

/** 已存储的字段路径 → 级联选择器的选中值（对象/数组整体映射到 ~self 叶子） */
export function storedPathToCascaderValue(schema: FormSchema, path: string): string | null {
  const field = resolveFieldByPath(schema, path)
  if (!field) return null
  if (isContainer(field)) return path + WHOLE_MARKER
  return path
}

/** 级联选择器的选中值 → 已存储的字段路径 */
export function cascaderValueToStoredPath(value: string | number | null): string {
  if (typeof value === 'string' && value.endsWith(WHOLE_MARKER)) {
    return value.slice(0, -WHOLE_MARKER.length)
  }
  return typeof value === 'string' ? value : ''
}

export function getDatePickerType(pattern = 'yyyy-MM-dd'): 'date' | 'datetime' | 'month' | 'year' {
  if (pattern.includes('HH')) return 'datetime'
  if (pattern === 'yyyy-MM') return 'month'
  if (pattern === 'yyyy') return 'year'
  return 'date'
}

function pad(n: number): string {
  return n < 10 ? '0' + n : String(n)
}

/** 时间戳 → 按 pattern 格式化的字符串，如 yyyy-MM-dd → 2026-08-15 */
export function formatDate(
  timestamp: number | string | null | undefined,
  pattern = 'yyyy-MM-dd',
): string {
  if (timestamp === null || timestamp === undefined || timestamp === '') return ''
  const d = new Date(Number(timestamp))
  if (isNaN(d.getTime())) return ''
  return pattern
    .replace('yyyy', String(d.getFullYear()))
    .replace('MM', pad(d.getMonth() + 1))
    .replace('dd', pad(d.getDate()))
    .replace('HH', pad(d.getHours()))
    .replace('mm', pad(d.getMinutes()))
    .replace('ss', pad(d.getSeconds()))
}

/** 已存储的日期字符串（或时间戳字符串）→ 时间戳，供 NDatePicker 使用 */
export function parseDate(value: string, pattern = 'yyyy-MM-dd'): number | null {
  if (!value) return null
  const n = Number(value)
  if (!isNaN(n)) return n
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d.getTime()
}
