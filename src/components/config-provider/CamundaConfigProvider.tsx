import { defineComponent, computed, provide, inject, watchEffect, type PropType } from 'vue'
import {
  NConfigProvider,
  darkTheme,
  zhCN as naiveZhCN,
  enUS as naiveEnUS,
  dateZhCN as naiveDateZhCN,
  dateEnUS as naiveDateEnUS,
  type GlobalThemeOverrides,
} from 'naive-ui'
import { configProviderInjectionKey, type LocaleType, type ThemeType } from './context'
import {
  setLocale,
  setLocaleMessages,
  resolveNaiveLocale,
  resolveNaiveDateLocale,
} from '../../locales'

export interface CamundaConfigProviderProps {
  /** 主题：light（浅色）/ dark（深色），未传时继承父级配置 */
  theme?: ThemeType
  /** NaiveUI 主题覆盖配置（GlobalThemeOverrides） */
  themeOverrides?: GlobalThemeOverrides
  /** 语言：zh-CN / en-US 等 */
  locale?: LocaleType
  /** 语言回退：当前语言缺少翻译时使用的兜底语言 */
  localeFallback?: LocaleType
  /** 自定义语言包：按语言聚合的翻译键值 */
  localeMessages?: Record<string, Record<string, any>>
  /** 时间显示格式，如 YYYY-MM-DD HH:mm:ss */
  timeFormat?: string
}

export default defineComponent<CamundaConfigProviderProps>({
  name: 'CamundaConfigProvider',
  props: {
    /** 主题：light（浅色）/ dark（深色），未传时继承父级配置 */
    theme: {
      type: String as PropType<ThemeType>,
      default: undefined,
    },
    /** NaiveUI 主题覆盖配置（GlobalThemeOverrides） */
    themeOverrides: {
      type: Object as PropType<GlobalThemeOverrides>,
      default: undefined,
    },
    /** 语言：zh-CN / en-US 等 */
    locale: {
      type: String as PropType<LocaleType>,
      default: undefined,
    },
    /** 语言回退：当前语言缺少翻译时使用的兜底语言 */
    localeFallback: {
      type: String as PropType<LocaleType>,
      default: undefined,
    },
    /** 自定义语言包：按语言聚合的翻译键值 */
    localeMessages: {
      type: Object as PropType<Record<string, Record<string, any>>>,
      default: undefined,
    },
    /** 时间显示格式，如 YYYY-MM-DD HH:mm:ss */
    timeFormat: {
      type: String,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    const parentConfig = inject(configProviderInjectionKey, null)

    const mergedTheme = computed(() => props.theme ?? parentConfig?.themeRef.value ?? 'light')
    const mergedLocale = computed(() => props.locale ?? parentConfig?.localeRef.value ?? 'zh-CN')
    const mergedLocaleFallback = computed(
      () => props.localeFallback ?? parentConfig?.localeFallbackRef.value ?? 'en-US',
    )
    const mergedLocaleMessages = computed(
      () => props.localeMessages ?? parentConfig?.localeMessagesRef.value,
    )
    const mergedTimeFormat = computed(
      () => props.timeFormat ?? parentConfig?.timeFormatRef.value ?? 'YYYY-MM-DD HH:mm:ss',
    )
    const mergedThemeOverrides = computed(
      () => props.themeOverrides ?? parentConfig?.themeOverridesRef.value,
    )

    const themeRef = computed(() => mergedTheme.value)
    const localeRef = computed(() => mergedLocale.value)
    const localeFallbackRef = computed(() => mergedLocaleFallback.value)
    const localeMessagesRef = computed(() => mergedLocaleMessages.value)
    const timeFormatRef = computed(() => mergedTimeFormat.value)
    const themeOverridesRef = computed(() => mergedThemeOverrides.value)

    const currentNaiveTheme = computed(() => {
      return mergedTheme.value === 'dark' ? darkTheme : null
    })

    const currentNaiveLocale = computed(() => {
      return resolveNaiveLocale(mergedLocale.value)
    })

    const currentNaiveDateLocale = computed(() => {
      return resolveNaiveDateLocale(mergedLocale.value)
    })

    watchEffect(() => {
      setLocale(mergedLocale.value)
    })

    watchEffect(() => {
      if (mergedLocaleMessages.value) {
        const msgs = mergedLocaleMessages.value[mergedLocale.value]
        if (msgs) {
          setLocaleMessages(mergedLocale.value, msgs)
        }
      }
    })

    watchEffect(() => {
      if (typeof document !== 'undefined' && !parentConfig) {
        if (mergedTheme.value === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    })

    provide(configProviderInjectionKey, {
      themeRef,
      localeRef,
      localeFallbackRef,
      localeMessagesRef,
      timeFormatRef,
      themeOverridesRef,
    })

    return () => (
      <NConfigProvider
        abstract
        theme={currentNaiveTheme.value}
        themeOverrides={mergedThemeOverrides.value}
        locale={currentNaiveLocale.value}
        dateLocale={currentNaiveDateLocale.value}
      >
        {slots.default?.()}
      </NConfigProvider>
    )
  },
})
