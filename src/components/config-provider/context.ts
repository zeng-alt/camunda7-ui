import { type InjectionKey, type Ref, inject } from 'vue'
import type { CamundaLookups } from '../../composables'

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

export interface CamundaLookupsContext {
  lookups: CamundaLookups
  registerLookups: (lookups: Partial<CamundaLookups>) => void
}

export const lookupsInjectionKey: InjectionKey<CamundaLookupsContext> = Symbol('CamundaLookups')

export function useCamundaLookupsContext(): CamundaLookupsContext | null {
  return inject(lookupsInjectionKey, null)
}
