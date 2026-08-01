import { computed } from 'vue'

/** 表单尺寸：小 / 中 / 大 */
export type FormSize = 'small' | 'medium' | 'large'

const labelClassMap: Record<FormSize, string> = {
  small: 'form-label-sm',
  medium: 'form-label-md',
  large: 'form-label-lg',
}

/**
 * @description 根据表单尺寸返回对应的标签样式类名。
 *
 * 尺寸映射到 UnoCSS 快捷类：
 * - `form-label-sm`（12px）
 * - `form-label-md`（14px）
 * - `form-label-lg`（16px）
 *
 * 颜色统一为 `#666`，适用于标签 / 标题文本随 formSize 缩放。
 *
 * ## 用法
 *
 * 注意：`labelClass` 是 `ComputedRef`，在 JSX 中使用必须显式解包 `.value`（JSX 不像 Vue 模板那样自动解包 ref）：
 *
 * ```ts
 * const { labelClass } = useFormSize(() => props.formSize)
 * // <label class={`mb-4px ${labelClass.value}`}>
 * ```
 *
 * @param getFormSize 获取当前表单尺寸的函数
 * @returns `labelClass`：响应式标签样式类名
 */
export function useFormSize(getFormSize: () => FormSize) {
  const labelClass = computed(() => labelClassMap[getFormSize()] ?? labelClassMap.small)
  return { labelClass }
}
