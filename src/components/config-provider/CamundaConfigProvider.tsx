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
import { setLocale, setLocaleMessages, resolveNaiveLocale, resolveNaiveDateLocale } from '../../locales'

export default defineComponent({
  name: 'CamundaConfigProvider',
  props: {
    theme: {
      type: String as PropType<ThemeType>,
      default: undefined,
    },
    themeOverrides: {
      type: Object as PropType<GlobalThemeOverrides>,
      default: undefined,
    },
    locale: {
      type: String as PropType<LocaleType>,
      default: undefined,
    },
    localeFallback: {
      type: String as PropType<LocaleType>,
      default: undefined,
    },
    localeMessages: {
      type: Object as PropType<Record<string, Record<string, any>>>,
      default: undefined,
    },
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
