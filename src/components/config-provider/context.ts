import { type InjectionKey, type Ref, inject } from 'vue'

export type ThemeType = 'light' | 'dark' | null
export type LocaleType = 'zh-CN' | 'en-US'

export interface CamundaConfig {
  theme?: ThemeType
  themeOverrides?: Record<string, any> // Extend this type depending on Naive UI GlobalThemeOverrides if needed
  locale?: LocaleType
  timeFormat?: string
}

export interface CamundaConfigContext extends CamundaConfig {
  themeRef: Ref<ThemeType | undefined>
  localeRef: Ref<LocaleType | undefined>
  timeFormatRef: Ref<string | undefined>
  themeOverridesRef: Ref<Record<string, any> | undefined>
}

export const configProviderInjectionKey: InjectionKey<CamundaConfigContext> =
  Symbol('CamundaConfigProvider')

export function useCamundaConfig() {
  const config = inject(configProviderInjectionKey, null)
  return config
}
