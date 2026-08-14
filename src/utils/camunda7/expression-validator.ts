/**
 * 轻量的 Camunda 表达式静态校验（零依赖）。
 *
 * 校验范围：`${...}` / `#{...}` 插值配平、括号 / 中括号 / 花括号配平、
 * 空插值、未闭合字符串，以及定时器 ISO 8601 / cron 格式。
 */

export type ExpressionErrorCode =
  | 'EXPR_UNCLOSED_STRING'
  | 'EXPR_UNCLOSED_BRACKET'
  | 'EXPR_STRAY_CLOSE'
  | 'EXPR_UNBALANCED'
  | 'EXPR_EMPTY_INTERP'
  | 'EXPR_UNCLOSED_INTERP'
  | 'TIMER_INVALID'

export interface ExpressionValidationResult {
  valid: boolean
  code?: ExpressionErrorCode
  position?: number
  message?: string
}

type DelimiterKind = 'expr' | '(' | '[' | '{'

interface Delimiter {
  kind: DelimiterKind
  start: number
}

function invalid(code: ExpressionErrorCode, position: number): ExpressionValidationResult {
  return { valid: false, code, position }
}

/**
 * 校验 Camunda 表达式的结构合法性（括号配平、插值配平、空插值、字符串闭合）。
 * 空字符串视为合法。
 */
export function validateCamundaExpression(value: string): ExpressionValidationResult {
  const expr = value || ''
  const stack: Delimiter[] = []
  const closingToOpen: Record<string, DelimiterKind> = { ')': '(', ']': '[', '}': '{' }
  let inString: '"' | "'" | null = null
  let i = 0
  const n = expr.length

  while (i < n) {
    const ch = expr[i]

    if (inString) {
      if (ch === '\\') {
        i += 2
        continue
      }
      if (ch === inString) inString = null
      i++
      continue
    }

    if (ch === '"' || ch === "'") {
      inString = ch
      i++
      continue
    }

    if (ch === '$' && expr[i + 1] === '{') {
      stack.push({ kind: 'expr', start: i + 2 })
      i += 2
      continue
    }

    if (ch === '#' && expr[i + 1] === '{') {
      stack.push({ kind: 'expr', start: i + 2 })
      i += 2
      continue
    }

    if (ch === '(' || ch === '[' || ch === '{') {
      stack.push({ kind: ch, start: i })
      i++
      continue
    }

    if (ch === ')' || ch === ']' || ch === '}') {
      const top = stack.pop()
      if (!top) {
        return invalid('EXPR_STRAY_CLOSE', i)
      }
      if (top.kind === 'expr') {
        if (ch !== '}') return invalid('EXPR_UNBALANCED', i)
        const content = expr.slice(top.start, i)
        if (!content.trim()) return invalid('EXPR_EMPTY_INTERP', top.start - 2)
      } else if (top.kind !== closingToOpen[ch]) {
        return invalid('EXPR_UNBALANCED', i)
      }
      i++
      continue
    }

    i++
  }

  if (inString) return invalid('EXPR_UNCLOSED_STRING', n)

  if (stack.length > 0) {
    const top = stack[stack.length - 1]!
    return invalid(
      top.kind === 'expr' ? 'EXPR_UNCLOSED_INTERP' : 'EXPR_UNCLOSED_BRACKET',
      top.start,
    )
  }

  return { valid: true }
}

/** ISO 8601 组合日期时间，如 2024-01-01T00:00:00Z 或 2024-01-01T08:09:40+02:00 */
export function validateIsoDateTime(value: string): boolean {
  if (!value) return true
  if (/^\$\{.*\}$/.test(value.trim())) return true
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/.test(value.trim())
}

/** ISO 8601 持续时间，如 PT15S / PT1H30M / P14D */
export function validateIsoDuration(value: string): boolean {
  if (!value) return true
  if (/^\$\{.*\}$/.test(value.trim())) return true
  return /^P(?=\d|T\d)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?$/.test(
    value.trim(),
  )
}

/** 宽松 cron 表达式（5-7 个以空格分隔的字段）或 ISO 重复间隔 R5/PT10S */
export function validateTimeCycle(value: string): boolean {
  if (!value) return true
  const v = value.trim()
  if (/^\$\{.*\}$/.test(v)) return true
  if (/^R\d*\//.test(v)) return validateIsoDuration(v.slice(v.indexOf('/') + 1))
  const fields = v.split(/\s+/)
  if (fields.length < 5 || fields.length > 7) return false
  return fields.every((f) => /^[0-9*/,\-?L#A-Za-z]+$/.test(f))
}

export type TimerFieldType = 'timeDate' | 'timeDuration' | 'timeCycle'

/**
 * 校验定时器字段值，返回错误码；合法或空值返回 null。
 */
export function validateTimerValue(
  type: TimerFieldType,
  value: string,
): ExpressionErrorCode | null {
  if (!value) return null
  const valid =
    type === 'timeDate'
      ? validateIsoDateTime(value)
      : type === 'timeDuration'
        ? validateIsoDuration(value)
        : validateTimeCycle(value)
  if (valid) return null
  return 'TIMER_INVALID'
}

/** 校验失败时返回错误码，成功返回 null。供 lint 规则等需要原始结果的场景使用。 */
export function validateCamundaExpressionCode(value: string): ExpressionErrorCode | null {
  const result = validateCamundaExpression(value)
  return result.valid ? null : (result.code ?? null)
}
