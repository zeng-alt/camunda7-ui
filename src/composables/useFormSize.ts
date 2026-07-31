import { computed } from 'vue'

export type FormSize = 'small' | 'medium' | 'large'

const labelClassMap: Record<FormSize, string> = {
  small: 'form-label-sm',
  medium: 'form-label-md',
  large: 'form-label-lg',
}

export function useFormSize(getFormSize: () => FormSize) {
  const labelClass = computed(() => labelClassMap[getFormSize()] ?? labelClassMap.small)
  return { labelClass }
}
