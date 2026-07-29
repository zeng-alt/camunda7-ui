import { type InjectionKey, type Ref, inject } from 'vue'

export type ThemeType = 'light' | 'dark' | null
export type LocaleType = 'zh-CN' | 'en-US' | (string & {})

export interface LocaleOption {
  label: string
  value: string
}

export interface CamundaConfig {
  theme?: ThemeType
  themeOverrides?: Record<string, any>
  locale?: LocaleType
  localeFallback?: LocaleType
  localeMessages?: Record<string, Record<string, any>>
  timeFormat?: string
}

export interface CamundaConfigContext extends CamundaConfig {
  themeRef: Ref<ThemeType | undefined>
  localeRef: Ref<LocaleType | undefined>
  localeFallbackRef: Ref<LocaleType | undefined>
  localeMessagesRef: Ref<Record<string, Record<string, any>> | undefined>
  timeFormatRef: Ref<string | undefined>
  themeOverridesRef: Ref<Record<string, any> | undefined>
}

export const configProviderInjectionKey: InjectionKey<CamundaConfigContext> =
  Symbol('CamundaConfigProvider')

export function useCamundaConfig() {
  const config = inject(configProviderInjectionKey, null)
  return config
}
